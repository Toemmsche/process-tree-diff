/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {LogMessage} from "./LogMessage.js";

/**
 * A simple logging class.
 * @property {Object} LOG_LEVELS The five log levels available
 */
export class Logger {

    static LOG_LEVELS = {
        STAT: "STAT",
        INFO: "INFO",
        DEBUG: "DEBUG",
        WARN: "WARN",
        ERROR: "ERROR"
    }
    /**
     * Wether logging is enabled.
     * @type {boolean}
     * @private
     */
    static _enabled = false;

    /**
     * Helper variable for {@see startTimed} and {@see endTimed}
     * @type Number
     * @private
     */
    static _startTime;

    /**
     * Handle an incoming log message. Either log level specific handlers or default handlers are used.
     * @param {LogMessage} logMsg The incoming log message.
     * @private
     */
    static _handleLog(logMsg) {
        //TODO remove
        if (logMsg.level === this.LOG_LEVELS.ERROR || logMsg.level === this.LOG_LEVELS.DEBUG) {
            console.error(logMsg.toString());
        } else if (this._enabled) {
            console.log(logMsg.toString());
        }
    }

    /**
     * Puplish a log with log level INFO.
     * @param {String} message The message to log
     * @param {Object} source The caller object
     */
    static info(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.INFO, message, source);
        this._handleLog(logMessage);
    }

    /**
     * Puplish a log with log level STAT.
     * @param {String} message The message to log
     * @param {Object} source The caller object
     */
    static stat(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.STAT, message, source);
        this._handleLog(logMessage);
    }

    /**
     * Puplish a log with log level DEBUG.
     * @param {String} message The message to log
     * @param {Object} source The caller object
     */
    static debug(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.DEBUG, message, source);
        this._handleLog(logMessage);
    }

    /**
     * Puplish a log with log level WARN.
     * @param {String} message The message to log
     * @param {Object} source The caller object
     */
    static warn(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.WARN, message, source);
        this._handleLog(logMessage);
    }

    /**
     * Puplish a log with log level ERROR.
     * @param {String} message The message to log
     * @param {Object} source The caller object
     */
    static error(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.ERROR, message, source);
        this._handleLog(logMessage);
    }

    /**
     * Puplish a result. Results are directly published to stdout.
     * @param {String} message The message to log
     * @param {Object} source The caller object
     */
    static result(message, source = null) {
        //results are always printed to stdout
        console.log(message);
    }

    /**
     * Disable logging. Result logs are not affected.
     * @return boolean If logging was previously enabled
     */
    static disableLogging() {
        const wasEnabled = this._enabled;
        this._enabled = false;
        return wasEnabled;
    }

    /**
     * Enable logging. Result logs are not affected.
     */
    static enableLogging() {
        this._enabled = true;
    }

    /**
     *  Start a timer.
     */
    static startTimed() {
        if (this._enabled) {
            this._startTime = new Date().getTime();
        }
    }

    /**
     * End the timer and return the elapsed time in milliseconds.
     * @returns {Number} The elapsed time in milliseconds.
     */
    static endTimed() {
        if (this._enabled) {
            if (this._startTime == null) {
                this.warn("Bad timer", this);
            }
            const elapsedTime = new Date().getTime() - this._startTime;
            this._startTime = null;
            return elapsedTime;
        }
    }

}