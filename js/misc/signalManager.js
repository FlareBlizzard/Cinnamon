const Lang = imports.lang;

/**
 * #SignalManager:
 * @short_description: A convenience object for managing signals
 * @object (Object): The object owning the SignalManager. All callbacks are
 * binded to @object.
 * @storage (Map): A map that stores all the connected signals. @storage is
 * indexed by the name of the signal, and each item in @storage is an array of
 * signals connected, and each signal is represented by an `[object, signalId,
 * callback]` triplet.
 *
 * The @SignalManager is a convenience object for managing signals. If you use
 * this to connect signals, you can later disconnect them by signal name or
 * just disconnect everything! No need to keep track of those annoying
 * @signalIds by yourself anymore!
 *
 * A common use case is to use the signalManager to connect to signals and then
 * use the @disconnectAllSignals function when the object is destroyed, to
 * avoid keeping track of all the signals manually.
 *
 * Note that every Javascript object should have its own @SignalManager, and
 * use it to connect signals of all objects it takes care of. For example, the
 * panel will have one `SignalManger` object, which manages all signals from
 * `GSettings`, `global.screen` etc.
 */
function SignalManager(object) {
    this._init(object);
}

SignalManager.prototype = {
    /**
     * _init:
     * @object (Object): the object owning the @SignalManager (usually @this)
     */
    _init: function(object) {
        this.object = object;
        this.storage = new Map();
    },

    /**
     * connect:
     * @obj (Object): the object whose signal we are listening to
     * @sigName (string): the name of the signal we are listening to
     * @callback (function): the callback function
     * force (boolean): whether to connect again even if it is connected
     *
     * This listens to the signal @sigName from @obj and calls @callback when
     * the signal is emitted. @callback is automatically binded to the object
     * owning the @SignalManager (as specified in the constructor).
     *
     * This checks whether the signal is already connected and will not connect
     * again if it is already connected. This behaviour can be overridden by
     * settings @force to be @true.
     *
     * For example, what you would normally write as
     * ```
     * global.settings.connect("changed::foo", Lang.bind(this, this._bar))
     * ```
     * would become
     * ```
     * this._signalManager.connect(global.settings, "changed::foo", this._bar)
     * ```
     *
     * Note that in this function, the first argument is the object, while the
     * second is the signal name. In all other methods, you first pass the
     * signal name, then the object (since the object is rarely passed in other
     * functions).
     */
    connect: function(obj, sigName, callback, force) {
        if (!this.storage.has(sigName))
            this.storage.set(sigName, []);

        if (!force && this.isConnected(sigName, obj, callback))
            return

        let id = obj.connect(sigName, Lang.bind(this.object, callback));
        this.storage.get(sigName).push([obj, id, callback]);
    },

    /**
     * isConnected:
     * @sigName (string): the signal we care about
     * @obj (Object): (optional) the object we care about, or leave empty if we
     * don't care about which object it is
     * @callback (function): (optional) the callback function we care about, or
     * leave empty if we don't care about what callback is connected
     *
     * This checks whether the signal @sigName is connected. The optional
     * arguments @obj and @callback can be used to specify what signals in
     * particular we want to know. Note that when you supply @callBack, you
     * usually want to supply @obj as well, since two different objects can
     * connect to the same signal with the same callback.
     *
     * Returns: Whether the signal is connected
     */
    isConnected: function(sigName, obj, callback) {
        if (!this.storage.has(sigName))
            return false;

        for (let signal of this.storage.get(sigName))
            if ((!obj || signal[0] == obj) &&
                (!callback || signal[2] == callback))
                return true;

        return false;
    },

    /**
     * disconnect:
     * @sigName (string): the signal we care about
     * @obj (Object): (optional) the object we care about, or leave empty if we
     * don't care about which object it is
     * @callback (function): (optional) the callback function we care about, or
     * leave empty if we don't care about what callback is connected
     *
     * This disconnects all *signals* named @sigName. By default, it
     * disconnects the signal on all objects, but can be fine-tuned with the
     * optional @obj and @callback arguments.
     *
     * This function will do nothing if no such signal is connected. So checks
     * need not be performed before calling this function.
     */
    disconnect: function(sigName, obj, callback) {
        if (!this.storage.has(sigName))
            return;

        for (let signal of this.storage.get(sigName))
            if ((!obj || signal[0] == obj) &&
                (!callback || signal[2] == callback))
                item[0].disconnect(item[1]);

        if (this.storage.get(sigName).length == 0)
            this.storage.delete(sigName);
    },

    /**
     * disconnectAllSignals:
     *
     * Disconnects *all signals* managed by the signal manager. This is useful
     * in the @destroy function of objects.
     */
    disconnectAllSignals: function() {
        for (let signals of this.storage.values())
            for (let item of signals)
                item[0].disconnect(item[1]);
        this.storage.clear();
    }
}
