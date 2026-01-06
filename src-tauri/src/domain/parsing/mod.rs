//! Log parsing bounded context.
//!
//! This module contains parsers for various log formats.

mod laravel;
mod traits;

pub use laravel::{LaravelDailyLogDetector, LaravelLogParser};
pub use traits::LogParser;
