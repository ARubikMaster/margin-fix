(function (exports, v) {
    "use strict";

    // Pull Discord's core modules using the local 'v' object
    const React = v.metro.common.React;
    const ReactNative = v.metro.common.ReactNative;

    let unpatch;

    function Settings() {
        // Safely initialize storage using the local plugin context
        if (v.plugin.storage.marginSize === undefined) {
            v.plugin.storage.marginSize = 25;
        }

        const [marginText, setMarginText] = React.useState(String(v.plugin.storage.marginSize));

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
                    v.plugin.storage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 12 } 
            }, "Change this number to push the server list further right.\n\n⚠️ Note: You must force-close and restart Discord for margin changes to take effect.")
        ]);
    }

    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                const GuildListView = v.metro.findByName("GuildListView", false);
                
                if (GuildListView) {
                    unpatch = v.patcher.after("default", GuildListView, (args, res) => {
                        if (res && res.props) {
                            const margin = v.plugin.storage.marginSize ?? 25;
                            res.props.style = [res.props.style, { marginLeft: margin }];
                        }
                    });
                }
            } catch (err) {
                console.error("[MarginFix] Crash prevented:", err);
            }
        },
        
        onUnload: () => {
            if (unpatch) unpatch();
        }
    };

    exports.default = MarginFix;
    Object.defineProperty(exports, "__esModule", { value: true });
    
    return exports;

// Notice we dropped 'window.' here so it uses Revenge's injected context!
})({}, vendetta);
