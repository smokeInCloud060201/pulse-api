use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, State, Emitter};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use uuid::Uuid;

pub struct WsState {
    pub connections: Mutex<HashMap<String, mpsc::Sender<String>>>,
}

#[derive(serde::Serialize, Clone)]
pub struct WsEventPayload {
    pub connection_id: String,
    pub event_type: String, // "message", "error", "closed"
    pub data: Option<String>,
}

#[tauri::command]
pub async fn connect_websocket(
    app: AppHandle,
    state: State<'_, WsState>,
    url: String,
) -> Result<String, String> {
    let (ws_stream, _) = connect_async(&url).await.map_err(|e| e.to_string())?;
    
    let connection_id = Uuid::new_v4().to_string();
    let (tx, mut rx) = mpsc::channel::<String>(100);
    
    state.connections.lock().unwrap().insert(connection_id.clone(), tx);
    
    let (mut write, mut read) = ws_stream.split();
    
    let conn_id_clone = connection_id.clone();
    
    // Spawn task to handle bidirectional communication
    tokio::spawn(async move {
        loop {
            tokio::select! {
                // Incoming message from WebSocket
                msg = read.next() => {
                    match msg {
                        Some(Ok(message)) => {
                            match message {
                                Message::Text(text) => {
                                    let _ = app.emit("ws_event", WsEventPayload {
                                        connection_id: conn_id_clone.clone(),
                                        event_type: "message".into(),
                                        data: Some(text.to_string()),
                                    });
                                }
                                Message::Close(_) => {
                                    let _ = app.emit("ws_event", WsEventPayload {
                                        connection_id: conn_id_clone.clone(),
                                        event_type: "closed".into(),
                                        data: None,
                                    });
                                    break;
                                }
                                _ => {} // Ignore binary/ping/pong for now
                            }
                        }
                        Some(Err(e)) => {
                            let _ = app.emit("ws_event", WsEventPayload {
                                connection_id: conn_id_clone.clone(),
                                event_type: "error".into(),
                                data: Some(e.to_string()),
                            });
                            break;
                        }
                        None => {
                            let _ = app.emit("ws_event", WsEventPayload {
                                connection_id: conn_id_clone.clone(),
                                event_type: "closed".into(),
                                data: None,
                            });
                            break;
                        }
                    }
                }
                
                // Outgoing message from Tauri command
                cmd = rx.recv() => {
                    match cmd {
                        Some(text) => {
                            if write.send(Message::Text(text.into())).await.is_err() {
                                break;
                            }
                        }
                        None => {
                            // Channel closed, disconnect
                            let _ = write.send(Message::Close(None)).await;
                            break;
                        }
                    }
                }
            }
        }
        
        // Clean up when loop exits
        // We can't easily access State here, but we can rely on disconnect command or just let it be zombie until disconnect is called
    });
    
    Ok(connection_id)
}

#[tauri::command]
pub async fn send_websocket_message(
    state: State<'_, WsState>,
    connection_id: String,
    message: String,
) -> Result<(), String> {
    let tx = {
        let conns = state.connections.lock().unwrap();
        conns.get(&connection_id).cloned()
    };
    
    if let Some(tx) = tx {
        tx.send(message).await.map_err(|e: tokio::sync::mpsc::error::SendError<String>| e.to_string())?;
        Ok(())
    } else {
        Err("Connection not found".to_string())
    }
}

#[tauri::command]
pub fn disconnect_websocket(
    state: State<'_, WsState>,
    connection_id: String,
) -> Result<(), String> {
    let mut conns = state.connections.lock().unwrap();
    if conns.remove(&connection_id).is_some() {
        // Dropping the Sender closes the channel, which exits the tokio::select! loop and sends Message::Close
        Ok(())
    } else {
        Err("Connection not found".to_string())
    }
}
