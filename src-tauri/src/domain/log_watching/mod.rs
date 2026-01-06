//! Log watching bounded context.
//!
//! This module contains all entities, value objects, and services
//! related to watching and tailing log files.

pub mod entities;
pub mod services;
pub mod value_objects;

pub use entities::*;
pub use value_objects::*;
