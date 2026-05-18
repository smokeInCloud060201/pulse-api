use crate::models::environment::Environment;
use regex::Regex;

pub fn resolve_variables(input: &str, env: Option<&Environment>) -> String {
    if let Some(environment) = env {
        // Find placeholders like {{variable_name}}
        let re = Regex::new(r"\{\{([^}]+)\}\}").unwrap();
        re.replace_all(input, |caps: &regex::Captures| {
            let key = caps.get(1).unwrap().as_str().trim();
            if let Some(var) = environment.variables.iter().find(|v| v.key == key && v.enabled) {
                var.value.clone()
            } else {
                // If variable not found or disabled, leave the placeholder intact
                caps.get(0).unwrap().as_str().to_string()
            }
        }).to_string()
    } else {
        input.to_string()
    }
}
