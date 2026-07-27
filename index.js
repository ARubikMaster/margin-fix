(function (exports, vendetta) {
    "use strict";

    let unpatch;

    // Helper function to safely get or initialize storage
    function getStorage() {
        const storage = vendetta?.plugin?.storage || vendetta?.storage;
        if (storage && storage.marginSize === undefined) {
            storage.marginSize = 25;
        }
        return storage;
    }

    // 1. Settings UI Panel
    function Settings() {
        const React = vendetta?.metro?.common?.React;
        const ReactNative = vendetta?.metro?.common?.ReactNative;
        const storage = getStorage();

        if (!React || !ReactNative || !storage) return null;

        if (vendetta?.storage?.useProxy) {
            vendetta.storage.useProxy(storage);
        }

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
                value: String(storage.marginSize ?? 25),
                onChangeText: (text) => {
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    storage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 8 } 
            }, "Change this number to push the server list further right.")
        ]);
    }

    // 2. Main Plugin Structure
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                const { metro, patcher } = vendetta;
                const storage = getStorage();
                const GuildListView = metro?.findByName("GuildListView", false);
                
                if (GuildListView && patcher) {
                    unpatch = patcher.after("default", GuildListView, (args, res) => {
                        if (res && res.props) {
                            const margin = storage?.marginSize ?? 25;
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
