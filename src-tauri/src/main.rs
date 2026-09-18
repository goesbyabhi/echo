#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

const HOST: &str = "127.0.0.1";
const PORT: u16 = 4096;

static SERVER: Mutex<Option<Child>> = Mutex::new(None);

fn server_address() -> SocketAddr {
    format!("{HOST}:{PORT}").parse().expect("valid server address")
}

fn server_up(addr: SocketAddr) -> bool {
    TcpStream::connect_timeout(&addr, Duration::from_millis(600)).is_ok()
}

fn sidecar_path() -> PathBuf {
    let mut base = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(|dir| dir.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."));
    base.push("opencode.exe");
    base
}

fn ensure_server(addr: SocketAddr) {
    if server_up(addr) {
        return
    }
    let bin = sidecar_path();
    if !bin.exists() {
        eprintln!("echo: sidecar not found at {}", bin.display())
    } else {
        match Command::new(&bin)
            .args([
                "serve",
                "--port",
                &PORT.to_string()[..],
                "--hostname",
                HOST,
                "--cors",
                "http://tauri.localhost",
            ])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
        {
            Ok(child) => {
                if let Ok(mut guard) = SERVER.lock() {
                    *guard = Some(child)
                }
            }
            Err(error) => eprintln!("echo: failed to start opencode: {error}"),
        }
    }
}

fn kill_server() {
    if let Ok(mut guard) = SERVER.lock() {
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

fn main() {
    let addr = server_address();
    ensure_server(addr);

    let app = tauri::Builder::default()
        .build(tauri::generate_context!())
        .expect("error while building echo");

    app.run(|_app_handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            kill_server()
        }
    });
}