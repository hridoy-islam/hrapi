// src/utils/moment-setup.ts
import moment from 'moment-timezone';

// Set the default timezone for the entire application
moment.tz.setDefault('Europe/London');

export default moment;