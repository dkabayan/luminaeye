use std::sync::Mutex;

#[repr(C)]
#[derive(Clone, Copy)]
pub struct GammaRamp {
    pub red: [u16; 256],
    pub green: [u16; 256],
    pub blue: [u16; 256],
}

static ORIGINAL_RAMP: Mutex<Option<GammaRamp>> = Mutex::new(None);

#[cfg(target_os = "windows")]
mod win {
    use super::GammaRamp;
    use std::ffi::c_void;

    #[repr(C)]
    struct RECT {
        left: i32,
        top: i32,
        right: i32,
        bottom: i32,
    }

    #[repr(C)]
    struct MONITORINFOEXW {
        cb_size: u32,
        rc_monitor: RECT,
        rc_work: RECT,
        dw_flags: u32,
        sz_device: [u16; 32],
    }

    type MonitorEnumProc =
        unsafe extern "system" fn(*mut c_void, *mut c_void, *mut RECT, isize) -> i32;

    #[link(name = "user32")]
    #[link(name = "gdi32")]
    unsafe extern "system" {
        fn GetDC(hwnd: *mut c_void) -> *mut c_void;
        fn ReleaseDC(hwnd: *mut c_void, hdc: *mut c_void) -> i32;
        fn DeleteDC(hdc: *mut c_void) -> i32;
        fn CreateDCW(
            pwsz_driver: *const u16,
            pwsz_device: *const u16,
            psz_port: *const u16,
            pdm: *const c_void,
        ) -> *mut c_void;
        fn SetDeviceGammaRamp(hdc: *mut c_void, lp_ramp: *const c_void) -> i32;
        fn GetDeviceGammaRamp(hdc: *mut c_void, lp_ramp: *mut c_void) -> i32;
        fn EnumDisplayMonitors(
            hdc: *mut c_void,
            lprc_clip: *const RECT,
            lpfn_enum: Option<MonitorEnumProc>,
            dw_data: isize,
        ) -> i32;
        fn GetMonitorInfoW(h_monitor: *mut c_void, lpmi: *mut MONITORINFOEXW) -> i32;
    }

    pub fn set_gamma(ramp: &GammaRamp) -> bool {
        let mut ok = false;

        unsafe extern "system" fn enum_proc(
            h_mon: *mut c_void,
            _hdc_mon: *mut c_void,
            _lprc_mon: *mut RECT,
            data: isize,
        ) -> i32 {
            unsafe {
                let ramp_ptr = data as *const GammaRamp;
                let mut info: MONITORINFOEXW = std::mem::zeroed();
                info.cb_size = std::mem::size_of::<MONITORINFOEXW>() as u32;

                if GetMonitorInfoW(h_mon, &mut info) != 0 {
                    let hdc = CreateDCW(
                        info.sz_device.as_ptr(),
                        std::ptr::null(),
                        std::ptr::null(),
                        std::ptr::null(),
                    );
                    if !hdc.is_null() {
                        SetDeviceGammaRamp(hdc, ramp_ptr as *const c_void);
                        DeleteDC(hdc);
                    }
                }
                1
            }
        }

        unsafe {
            let res = EnumDisplayMonitors(
                std::ptr::null_mut(),
                std::ptr::null(),
                Some(enum_proc),
                ramp as *const _ as isize,
            );
            if res != 0 {
                ok = true;
            }

            let primary_hdc = GetDC(std::ptr::null_mut());
            if !primary_hdc.is_null() {
                if SetDeviceGammaRamp(primary_hdc, ramp as *const _ as *const c_void) != 0 {
                    ok = true;
                }
                ReleaseDC(std::ptr::null_mut(), primary_hdc);
            }
        }

        ok
    }

    pub fn get_current_gamma() -> Option<GammaRamp> {
        unsafe {
            let hdc = GetDC(std::ptr::null_mut());
            if hdc.is_null() {
                return None;
            }
            let mut ramp: GammaRamp = std::mem::zeroed();
            let res = GetDeviceGammaRamp(hdc, &mut ramp as *mut _ as *mut c_void);
            ReleaseDC(std::ptr::null_mut(), hdc);
            if res != 0 {
                Some(ramp)
            } else {
                None
            }
        }
    }
}

pub fn init_backup() {
    #[cfg(target_os = "windows")]
    {
        if let Some(ramp) = win::get_current_gamma() {
            let mut guard = ORIGINAL_RAMP.lock().unwrap();
            if guard.is_none() {
                *guard = Some(ramp);
            }
        }
    }
}

pub fn make_identity_ramp() -> GammaRamp {
    let mut ramp = GammaRamp {
        red: [0; 256],
        green: [0; 256],
        blue: [0; 256],
    };
    for i in 0..256 {
        let val = ((i as f64 / 255.0) * 65535.0).round() as u16;
        ramp.red[i] = val;
        ramp.green[i] = val;
        ramp.blue[i] = val;
    }
    ramp
}

pub fn kelvin_to_rgb(kelvin: f64) -> (f64, f64, f64) {
    let clamped = kelvin.clamp(1000.0, 6500.0);
    let temp = clamped / 100.0;

    let r = if temp <= 66.0 {
        255.0
    } else {
        329.698727446 * (temp - 60.0).powf(-0.1332047592)
    };

    let g = if temp <= 66.0 {
        99.4708025861 * temp.ln() - 161.1195681661
    } else {
        288.1221695283 * (temp - 60.0).powf(-0.0755148492)
    };

    let b = if temp >= 66.0 {
        255.0
    } else if temp <= 19.0 {
        0.0
    } else {
        138.5177312231 * (temp - 10.0).ln() - 305.0447927307
    };

    (
        (r.clamp(0.0, 255.0)) / 255.0,
        (g.clamp(0.0, 255.0)) / 255.0,
        (b.clamp(0.0, 255.0)) / 255.0,
    )
}

pub fn apply_filter(kelvin: u32, brightness: f64, enabled: bool) -> bool {
    #[cfg(target_os = "windows")]
    {
        if !enabled {
            return reset_filter();
        }

        // Initialize backup if not done yet
        init_backup();

        let (r_factor, g_factor, b_factor) = kelvin_to_rgb(kelvin as f64);
        let bright_factor = (brightness / 100.0).clamp(0.1, 1.0);

        let mut ramp = GammaRamp {
            red: [0; 256],
            green: [0; 256],
            blue: [0; 256],
        };

        for i in 0..256 {
            let base = i as f64 / 255.0;
            ramp.red[i] = ((base * r_factor * bright_factor * 65535.0).round().clamp(0.0, 65535.0)) as u16;
            ramp.green[i] = ((base * g_factor * bright_factor * 65535.0).round().clamp(0.0, 65535.0)) as u16;
            ramp.blue[i] = ((base * b_factor * bright_factor * 65535.0).round().clamp(0.0, 65535.0)) as u16;
        }

        // Ensure monotonicity
        for i in 1..256 {
            if ramp.red[i] < ramp.red[i - 1] {
                ramp.red[i] = ramp.red[i - 1];
            }
            if ramp.green[i] < ramp.green[i - 1] {
                ramp.green[i] = ramp.green[i - 1];
            }
            if ramp.blue[i] < ramp.blue[i - 1] {
                ramp.blue[i] = ramp.blue[i - 1];
            }
        }

        win::set_gamma(&ramp)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = (kelvin, brightness, enabled);
        false
    }
}

pub fn reset_filter() -> bool {
    #[cfg(target_os = "windows")]
    {
        let guard = ORIGINAL_RAMP.lock().unwrap();
        let ramp = if let Some(saved) = *guard {
            saved
        } else {
            make_identity_ramp()
        };
        win::set_gamma(&ramp)
    }

    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}
