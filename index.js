(function (exports, vendetta) {
    "use strict";

    // 1. Pull Discord's core modules at the top level so they never fail
    const React = vendetta.metro.common.React;
    const ReactNative = vendetta.metro.common.ReactNative;
    const pluginStorage = vendetta.plugin.storage;

    let unpatch;

    // 2. The Settings UI
    function Settings() {
        // Guarantee a default value exists
        if (pluginStorage.marginSize === undefined) {
            pluginStorage.marginSize = 25;
        }

        const [marginText, setMarginText] = React.useState(String(pluginStorage.marginSize));

        return React.createElement(ReactNative.View, { style: { padding: 16, flex: 1 } }, [
            React.createElement(ReactNative.Text, { 
                key: "label", 
                style: { color: "#FFFFFF", fontSize: 16, marginBottom: 8, fontWeight: "bold" } 
            }, "Server List Margin (Pixels):"),
            
            React.createElement(ReactNative.TextInput, {
                key: "input",
                style: { backgroundColor: "#202225", color: "#FFFFFF", padding: 12, borderRadius: 8, fontSize: 16 },
                keyboardType: "numeric",
                placeholder: "25",
                placeholderTextColor: "#72767d",
                value: marginText,
                onChangeText: (text) => {
                    setMarginText(text);
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    pluginStorage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 12 } 
            }, "Change this number to push the server list further right.\n\n⚠️ Note: You must force-close and restart Discord for margin changes to take effect.")
        ]);
    }

    // 3. The Core Plugin Logic
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            const GuildListView = vendetta.metro.findByName("GuildListView", false);
            
            if (GuildListView) {
                unpatch = vendetta.patcher.after("default", GuildListView, (args, res) => {
                    if (res && res.props) {
                        const margin = pluginStorage.marginSize ?? 25;
                        res.props.style = [res.props.style, { marginLeft: margin }];
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
