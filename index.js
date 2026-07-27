(function (exports, vendetta) {
    "use strict";

    let unpatch;

    // 1. The Settings UI
    function Settings() {
        // Grab Discord's internal UI modules ONLY when the gear is clicked
        const React = vendetta.metro.common.React;
        const ReactNative = vendetta.metro.common.ReactNative;

        // Initialize storage safely
        if (vendetta.plugin.storage.marginSize === undefined) {
            vendetta.plugin.storage.marginSize = 25;
        }

        // Use standard React State for the text box
        const [marginText, setMarginText] = React.useState(String(vendetta.plugin.storage.marginSize));

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
                    // Update what you see typing
                    setMarginText(text);
                    // Save the math to disk
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    vendetta.plugin.storage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 12 } 
            }, "Change this number to push the server list further right.\n\n⚠️ Note: You must force-close and restart Discord for margin changes to take effect.")
        ]);
    }

    // 2. The Core Plugin Logic
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                // Grab the UI patcher ONLY when the plugin is toggled on
                const GuildListView = vendetta.metro.findByName("GuildListView", false);
                
                if (GuildListView) {
                    unpatch = vendetta.patcher.after("default", GuildListView, (args, res) => {
                        if (res && res.props) {
                            const margin = vendetta.plugin.storage.marginSize ?? 25;
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

})({}, window.vendetta);
