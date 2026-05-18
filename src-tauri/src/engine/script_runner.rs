use crate::models::environment::{Environment, EnvVariable};
use crate::models::response::ApiResponse;
use boa_engine::{Context, Source, JsValue, JsArgs, NativeFunction, object::ObjectInitializer, property::Attribute, JsString};
use std::cell::RefCell;
use std::rc::Rc;

pub struct ScriptContext {
    pub environment: Environment,
    pub console_logs: Vec<String>,
}

pub fn run_script(script: &str, environment: Environment, api_response: Option<&ApiResponse>) -> Result<ScriptContext, String> {
    let mut context = Context::default();
    
    let shared_state = Rc::new(RefCell::new(ScriptContext {
        environment,
        console_logs: Vec::new(),
    }));

    let state_clone = shared_state.clone();
    let pm_env_set = unsafe { NativeFunction::from_closure(move |_, args, _context| {
        let key = args.get_or_undefined(0).to_string(_context).unwrap_or_default().to_std_string_escaped();
        let value = args.get_or_undefined(1).to_string(_context).unwrap_or_default().to_std_string_escaped();
        
        let mut state = state_clone.borrow_mut();
        let env_id = state.environment.id.clone();
        if let Some(var) = state.environment.variables.iter_mut().find(|v| v.key == key) {
            var.value = value;
            var.enabled = true;
        } else {
            state.environment.variables.push(EnvVariable {
                id: format!("env_var_{}", uuid::Uuid::new_v4()),
                environment_id: env_id,
                key,
                value,
                var_type: "default".to_string(),
                enabled: true,
            });
        }
        Ok(JsValue::undefined())
    }) };

    let state_clone_get = shared_state.clone();
    let pm_env_get = unsafe { NativeFunction::from_closure(move |_, args, _context| {
        let key = args.get_or_undefined(0).to_string(_context).unwrap_or_default().to_std_string_escaped();
        let state = state_clone_get.borrow();
        if let Some(var) = state.environment.variables.iter().find(|v| v.key == key) {
            Ok(JsValue::from(JsString::from(var.value.as_str())))
        } else {
            Ok(JsValue::undefined())
        }
    }) };

    let mut pm_env_obj = ObjectInitializer::new(&mut context);
    pm_env_obj.function(pm_env_set, JsString::from("set"), 2);
    pm_env_obj.function(pm_env_get, JsString::from("get"), 1);
    let pm_env = pm_env_obj.build();

    let pm_res = if let Some(resp) = api_response {
        let body_str = resp.body.clone();
        let body_str2 = body_str.clone();

        let pm_response_json = unsafe { NativeFunction::from_closure(move |_, _, _context| {
            let json_src = format!("JSON.parse(`{}`)", body_str.replace("`", "\\`"));
            let res = _context.eval(Source::from_bytes(json_src.as_bytes()));
            match res {
                Ok(val) => Ok(val),
                Err(_) => Ok(JsValue::undefined()),
            }
        }) };

        let pm_response_text = unsafe { NativeFunction::from_closure(move |_, _, _context| {
            Ok(JsValue::from(JsString::from(body_str2.as_str())))
        }) };

        let mut pm_res_obj = ObjectInitializer::new(&mut context);
        pm_res_obj.function(pm_response_json, JsString::from("json"), 0);
        pm_res_obj.function(pm_response_text, JsString::from("text"), 0);
        Some(pm_res_obj.build())
    } else {
        None
    };

    let mut pm_obj = ObjectInitializer::new(&mut context);
    pm_obj.property(JsString::from("environment"), pm_env, Attribute::all());
    if let Some(res) = pm_res {
        pm_obj.property(JsString::from("response"), res, Attribute::all());
    }

    let pm = pm_obj.build();

    context.register_global_property(JsString::from("pm"), pm, Attribute::all())
        .map_err(|e| format!("Failed to register pm object: {}", e))?;

    let state_clone_log = shared_state.clone();
    let console_log = unsafe { NativeFunction::from_closure(move |_, args, _context| {
        let mut log_str = String::new();
        for arg in args {
            log_str.push_str(&arg.to_string(_context).unwrap_or_default().to_std_string_escaped());
            log_str.push(' ');
        }
        state_clone_log.borrow_mut().console_logs.push(log_str.trim().to_string());
        Ok(JsValue::undefined())
    }) };

    let mut console_obj = ObjectInitializer::new(&mut context);
    console_obj.function(console_log, JsString::from("log"), 1);
    let console = console_obj.build();
    
    context.register_global_property(JsString::from("console"), console, Attribute::all())
        .map_err(|e| format!("Failed to register console object: {}", e))?;

    let source = Source::from_bytes(script.as_bytes());
    if let Err(err) = context.eval(source) {
        return Err(format!("Script Error: {}", err));
    }

    let final_state = Rc::try_unwrap(shared_state)
        .map_err(|_| "Failed to unwrap shared state")?
        .into_inner();

    Ok(final_state)
}
