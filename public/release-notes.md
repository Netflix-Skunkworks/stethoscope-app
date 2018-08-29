Changed:

- Stethoscope is now a tray/menubar only application!
- Normalized practice names to camelCase between `yaml` and `json`
- Closing window collapses app to menubar/tray instead of quitting
- Improved logging

Added:

- Automatic scanning (weekly scan by default) - controlled by `rescanIntervalSeconds` in [src/config.json](src/config.json)
- Basic support for internationalization (practices.{LANGUAGE_CODE}.yaml)
- Documentation around policies
- New Mac device versions
- Instructions now display dynamic content via handlebars preprocessing
- Production debugging capabilities
- Basic linux support (requires `root`)

Fixed:

- Improved thrift connection stability and removed magic numbers/timing
- Windows not properly terminating osqueryd on close
