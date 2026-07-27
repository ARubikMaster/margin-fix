(function (exports, vendetta) {
    "use strict";

    let unpatch;
    const { metro, patcher, plugin, storage } = vendetta;
    
    // Pull Discord's internal React modules
    const React = metro.common.React;
    const ReactNative = metro.common.ReactNative;

    // 1. Set a default margin if you haven't saved one yet
    if (plugin.storage.marginSize === undefined) {
        plugin.storage.marginSize = 25;
    }

    // 2. Build the Settings UI Panel
    function Settings() {
        // This hook tells the UI to update live when you type
        storage.useProxy(plugin.storage);

        return React.createElement(ReactNative.View, { style: { padding: 16 } }, [
            // The Label
            React.createElement(ReactNative.Text, { 
                key: "label", 
                style: { color: "#FFFFFF", fontSize: 16, marginBottom: 8, fontWeight: "bold" } 
            }, "Server List Margin (Pixels):"),
            
            // The Number Input Box
            React.createElement(ReactNative.TextInput, {
                key: "input",
                style: { backgroundColor: "#202225", color: "#FFFFFF", padding: 12, borderRadius: 8, fontSize: 16 },
                keyboardType: "numeric",
                placeholder: "25",
                placeholderTextColor: "#72767d",
                value: String(plugin.storage.marginSize),
                onChangeText: (text) => {
                    // Strip letters and save the raw number to plugin storage
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    plugin.storage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            // The Helper Text
            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 8 } 
            }, "Change this number to push the server list further right. Note: You must force-restart Discord to see the changes take effect.")
        ]);
    }

    // 3. The Core Plugin Logic
    const MarginFix = {
        settings: Settings, // This binds your UI to the settings gear icon!
        onLoad: () => {
            const GuildListView = metro.findByName("GuildListView", false);
            
            if (GuildListView) {
                unpatch = patcher.after("default", GuildListView, (args, res) => {
                    if (res && res.props) {
                        // Dynamically pull the margin size from your settings!
                        res.props.style = [res.props.style, { marginLeft: plugin.storage.marginSize }];
                    }
                });
            }
        },
        onUnload: () => {
            if (unpatch) unpatch();
        }
    };

    exports.default = MarginFix;
    Object.defineProperty(exports, "__esModule", { value: true });
    
    return exports;

})({}, window.vendetta);
