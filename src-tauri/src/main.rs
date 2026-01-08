// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // On Linux, WebKitGTK can have GPU acceleration issues on some hardware.
    // Set fallback environment variables if not already configured by the user.
    #[cfg(target_os = "linux")]
    {
        use std::env;

        // WEBKIT_DISABLE_DMABUF_RENDERER fixes most GPU-related crashes
        // while still allowing some hardware acceleration
        if env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    logr_lib::run()
}
