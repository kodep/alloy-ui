/**
 * The DatePicker Component
 *
 * @module aui-datepicker
 * @submodule aui-datepicker-delegate
 */

var Lang = A.Lang;
var isString = Lang.isString;
var EVENT_ENTER_KEY = 'enterKey';
var EVENT_TAB_KEY = 'tabKey';

var _DOCUMENT = A.one(A.config.doc);

var getCN = A.getClassName;

var CSS_PREFIX = 'yui3';
var CSS_CALENDAR = getCN(CSS_PREFIX, 'calendar');

// Variable to store previous Node informaiton
var prevNode = {};

/**
 * Fired when then enter key is pressed on an input node.
 *
 * @event enterKey
 */

/**
 * A base class for `DatePickerDelegate`.
 *
 * @class A.DatePickerDelegate
 * @param {Object} config Object literal specifying widget configuration
 *     properties.
 * @constructor
 */

function DatePickerDelegate() {}

DatePickerDelegate.prototype = {
    _eventHandles: null,

    _userInteractionInProgress: false,

    /**
     * Construction logic executed during `DatePickerDelegate` instantiation.
     * Lifecycle.
     *
     * @method initializer
     * @protected
     */
    initializer: function() {
        var instance = this;

        instance.bindDelegateUI();

        this.after({
            render: this._afterRender
        });
    },

    /**
     * Destructor logic implementation for the `DatePickerDelegate` class.
     *
     * @method destroy
     * @protected
     */
    destroy: function() {
        var instance = this;

        (new A.EventHandle(instance._eventHandles)).detach();
    },

    /**
     * Bind the events on the `DatePickerDelegate` UI. Lifecycle.
     *
     * @method bindDelegateUI
     * @protected
     */
    bindDelegateUI: function() {
        var instance = this,
            container = instance.get('container'),
            trigger = instance.get('trigger');

        instance._eventHandles = [
            container.delegate(
                ['focus', 'mousedown'],
                A.bind('_onceUserInteraction', instance), trigger),

            container.delegate(
                'blur',
                A.bind('_onUserInteractionRelease', instance), trigger),

            container.delegate(
                'click',
                A.bind('_onceUserInteractionRelease', instance), trigger),

            container.delegate(
                'key', A.bind('_handleTabKeyEvent', instance), 'tab', trigger),

            container.delegate(
                'key', A.bind('_handleEscKeyEvent', instance), 'esc', trigger),

            container.delegate(
                'key', A.bind('_handleEnterKeyEvent', instance), 'enter', trigger)

        ];

        instance.after(
            'activeInputChange',
            A.bind('_afterActiveInputChange', instance));

        instance.publish(
            'selectionChange', {
                defaultFn: instance._defSelectionChangeFn
            });
      
        // Not tested.
        _DOCUMENT._eventHandles = [
            container.delegate(
                'key', A.bind('_handleEscKeyEvent', instance), 'esc', trigger)
        ];
    },

    /**
     * Method not implemented.
     *
     * @method focusSelectedValue
     */
    focusSelectedValue: function() {},

    /**
     * Gets the selected dates.
     *
     * @method getSelectedDates
     * @param node
     * @return {Object | null}
     */
    getSelectedDates: function(node) {
        var instance = this,
            activeInput = node || instance.get('activeInput'),
            selectedDates = null;

        if (activeInput) {
            selectedDates = activeInput.getData('datepickerSelection');
        }

        return selectedDates;
    },

    /**
     * Gets parsed dates from input value.
     *
     * @method getParsedDatesFromInputValue
     * @param opt_value
     * @return {Object | null}
     */
    getParsedDatesFromInputValue: function(opt_value) {
        var instance = this,
            valueExtractor = instance.get('valueExtractor'),
            parsedDates = valueExtractor.call(instance, opt_value);

        if (parsedDates) {
            return A.Array.filter(parsedDates, function(parsed) {
                return parsed !== false;
            });
        }

       return null;
    },

    /**
     * Method not implemented.
     *
     * @method useInputNode
     */
    useInputNode: function(node) {
        var instance = this;
            return instance.useInputNode(node);
    },

    /**
     * Triggers `useInputNode` method once.
     *
     * @method useInputNodeOnce
     * @param node
     */
    useInputNodeOnce: function(node) {
        var instance = this;

        if (!instance._userInteractionInProgress) {
            instance.useInputNode(node);
        }
    },

    /**
    * Fires when the 'activeInput' attribute changes.  The keydown listener is
    * removed from the old active input and is attached to the new one.
    *
    * @method _afterActiveInputChange
    * @param {EventFacade} event
    * @protected
    */
    _afterActiveInputChange: function(event) {
        var instance = this;

        if (event.prevVal) {
            event.prevVal.detach(
                'keydown', instance._handleKeydownEvent, instance);
        }

        if (event.newVal) {
            event.newVal.on('keydown', instance._handleKeydownEvent, instance);
        }
    },

    /**
     * Default behavior for selection change.
     *
     * @method _defSelectionChangeFn
     * @param event
     * @protected
     */
    _defSelectionChangeFn: function(event) {
        var instance = this,
            selection = event.newSelection,
            activeInput = instance.get('activeInput'),
            valueFormatter = instance.get('valueFormatter');

        valueFormatter.call(instance, selection);

        if (activeInput) {
            activeInput.setData('datepickerSelection', selection);
        }
    },

    /**
     * Formats a date according to a mask.
     *
     * @method _formatDate
     * @param event
     * @protected
     * @return {Date}
     */
    _formatDate: function(date) {
        var instance = this,
            mask = instance.get('mask');

        return A.Date.format(date, {
            format: mask
        });
    },

    /**
    * Handles keydown events
    *
    * @method _handleKeydownEvent
    * @param event
    * @protected
    */
    _handleKeydownEvent: function(event) {
        var instance = this;

        prevNode = event._currentTarget; // Might not want it to fire every keydown.

        if (event.isKey('enter')) {
            instance.fire(EVENT_ENTER_KEY);
        } else if (event.isKey('tab')) {
            instance.fire(EVENT_TAB_KEY);
        }
    },

    /**
    * Focuses on active calendar.
    *
    * @method _handleTabKeyEvent
    * @protected
    */
    _focusOnActiveCalendarNode: function() {
        var instance = this;
        var calendarNode = A.one('#' + instance.getCalendar()._calendarId)._node.parentNode.parentNode;

        calendarNode.focus();
    },

    /**
    * Focus on prior Node
    *
    * @method _focusOnLastNode
    * @protected
    */
    _focusOnLastNode: function() {
        var instance = this;

        instance._ATTR_E_FACADE.prevVal.set('_node', instance.newVal);
    },

    /**
    * Handles tab key events and focuses on calendar.
    *
    * @method _handleTabKeyEvent
    * @protected
    */
    _handleTabKeyEvent: function(event) {
        var instance = this;

        prevNode = event.currentTarget;

        instance._focusOnActiveCalendarNode();
    },

    /**
    * Handles esc key events
    *
    * @method _handleEscKeyEvent
    * @protected
    */
    _handleEscKeyEvent: function(event) {

        // Currently only firing while focused on node.
        var instance = this,
            calendar = instance.getCalendar();

        if (calendar.get('display') !== "hidden") {
            instance._focusOnLastNode();
            instance._ATTR_E_FACADE.newVal._node.focus();
        }
    },

    /**
    * Fires on enter
    *
    * @method _handleEnterKeyEvent
    * @protected
    */
    _handleEnterKeyEvent: function(event) {
        var instance = this;

        // if current node is an input field, auto show and focus calendar
        calendar = instance.getCalendar(),
        selectionMode = calendar.get('selectionMode');

        if ((instance.get('activeInput')._node.nodeName === 'INPUT') && (selectionMode !== 'multiple')) {
            instance.show();
            prevNode = event._currentTarget;
        }
    },

    /**
     * Fires once user interacts.
     *
     * @method _onceUserInteraction
     * @param event
     * @protected
     */
    _onceUserInteraction: function(event) {
        var instance = this;

        instance.useInputNodeOnce(event.currentTarget);
        instance._userInteractionInProgress = true;

        // Enables cyclical tab keyboard navigation
        instance._focusOnActiveCalendarNode();
    },

    /**
     * Fires once user interaction releases.
     *
     * @method _onceUserInteractionRelease
     * @param event
     * @protected
     */
    _onceUserInteractionRelease: function(event) {
        var instance = this;

        instance.useInputNodeOnce(event.currentTarget);

        instance.focusSelectedValue();

        instance._userInteractionInProgress = false;
    },

    /**
     * Fires when user interaction releases.
     *
     * @method _onUserInteractionRelease
     * @param event
     * @protected
     */
    _onUserInteractionRelease: function(event) {
        var instance = this;

        instance.useInputNode(event.currentTarget);

        instance._userInteractionInProgress = false;
    },

    /**
     * Extracts the input value.
     *
     * @method _valueExtractorFn
     * @protected
     */
    _valueExtractorFn: function() {
        return function(opt_value) {
            var instance = this,
                activeInput = instance.get('activeInput'),
                activeInputVal,
                activeInputValue,
                dateSeparator = instance.get('dateSeparator'),
                mask = instance.get('mask'),
                dates;

            if (activeInput) {
                activeInputVal = activeInput.val();
            }

            activeInputValue = Lang.trim(opt_value || activeInputVal);

            if (activeInputValue) {
                dates = [];
                A.Array.each(
                    activeInputValue.split(dateSeparator),
                    function(text) {
                        text = Lang.trim(text);
                        if (text) {
                            dates.push(A.Date.parse(mask, text));
                        }
                    });
            }

            return dates;
        };
    },

    /**
     * Formats a date value.
     *
     * @method _valueFormatterFn
     * @protected
     * @return {Function}
     */
    _valueFormatterFn: function() {
        return function(dates) {
            var instance = this,
                activeInput = instance.get('activeInput'),
                dateSeparator = instance.get('dateSeparator'),
                values = [];

            A.Array.each(dates, function(date) {
                values.push(instance._formatDate(date));
            });

            if (activeInput) {
                activeInput.val(values.join(dateSeparator));
            }
        };
    },
};

/**
 * Static property used to define the default attribute configuration for the
 * `DatePickerDelegate`.
 *
 * @property ATTRS
 * @type {Object}
 * @static
 */
DatePickerDelegate.ATTRS = {

    /**
     * The active input element that holds the calendar instance.
     *
     * @attribute activeInput
     */
    activeInput: {},

    /**
     * Contains an element.
     *
     * @attribute container
     * @writeOnce
     */
    container: {
        setter: A.one,
        value: _DOCUMENT,
        writeOnce: true
    },

    /**
     * Character that separate dates.
     *
     * @attribute dateSeparator
     * @default ' \u2014 '
     * @type {String}
     */
    dateSeparator: {
        value: ' \u2014 ',
        validator: Lang.isString
    },

    /**
     * Defines the date format.
     *
     * @attribute mask
     * @default '%m/%d/%Y'
     * @type {String}
     */
    mask: {
        value: '%m/%d/%Y',
        validator: Lang.isString
    },

    /**
     * Stores a trigger.
     *
     * @attribute trigger
     * @type {String}
     * @writeOnce
     */
    trigger: {
        validator: isString,
        writeOnce: true
    },

    /**
     * Extracts a value from a function.
     *
     * @attribute valueExtractor
     * @type {Function}
     */
    valueExtractor: {
        valueFn: '_valueExtractorFn',
        validator: Lang.isFunction
    },

    /**
     * Formats a value from a function.
     *
     * @attribute valueFormatter
     * @type {Function}
     */
    valueFormatter: {
        valueFn: '_valueFormatterFn',
        validator: Lang.isFunction
    }
};

A.DatePickerDelegate = DatePickerDelegate;