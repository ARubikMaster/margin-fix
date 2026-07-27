(function (exports, vendetta) {
    "use strict";

    let unpatch;

    // 1. Settings UI Panel using standard React State
    function Settings() {
        const React = vendetta?.metro?.common?.React;
        const ReactNative = vendetta?.metro?.common?.ReactNative;
        const pluginStorage = vendetta?.plugin?.storage;

        if (!React || !ReactNative || !pluginStorage) return null;

        // Initialize our storage variable if it's completely empty
        if (pluginStorage.marginSize === undefined) {
            pluginStorage.marginSize = 25;
        }

        // Use React to hold the text box value so it doesn't crash
        const [marginText, setMarginText] = React.useState(String(pluginStorage.marginSize));

        return React.createElement(ReactNative.View, { style: { padding: 16 } }, [
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
                    // Update the UI
                    setMarginText(text);
                    // Save the actual number to Revenge's storage
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    pluginStorage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 8 } 
            }, "Change this number to push the server list further right. Note: You must fully restart Discord to see the changes take effect.")
        ]);
    }

    // 2. Main Plugin Structure
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                const { metro, patcher, plugin } = vendetta;
                const GuildListView = metro?.findByName("GuildListView", false);
                
                if (GuildListView && patcher) {
                    unpatch = patcher.after("default", GuildListView, (args, res) => {
                        if (res && res.props) {
                            // Safely pull the margin size, default to 25 if something goes wrong
                            const margin = plugin?.storage?.marginSize ?? 25;
                            res.props.style = [res.props.style, { marginLeft: margin }];
                        }
                    });
                }
            } catch (err) {
                console.error("[MarginFix] Failed to load patch:", err);
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
