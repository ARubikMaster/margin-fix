(function (exports, v) {
    "use strict";

    let unpatch;

    function Settings() {
        const React = v.metro.common.React;
        const ReactNative = v.metro.common.ReactNative;

        if (v.plugin.storage.marginSize === undefined) {
            v.plugin.storage.marginSize = 25;
        }

        const [marginText, setMarginText] = React.useState(String(v.plugin.storage.marginSize));

        return React.createElement(ReactNative.View, { style: { padding: 16, flex: 1 } }, [
            React.createElement(ReactNative.Text, { 
                key: "label", 
                style: { color: "#FFFFFF", fontSize: 16, marginBottom: 8, fontWeight: "bold" } 
            }, "Screen Protector Margin Offset (Pixels):"),
            
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
                    v.plugin.storage.marginSize = isNaN(num) ? 25 : num;
                }
            }),
            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 12 } 
            }, "Applies a safe-area translation to shift the entire app interface away from the edge.")
        ]);
    }

    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                // Target the core Navigation/App container wrapper instead of individual components
                const AppView = v.metro.findByName("AppView", false) || v.metro.findByName("Root", false);
                
                if (AppView) {
                    unpatch = v.patcher.after("default", AppView, (args, res) => {
                        if (res && res.props) {
                            const margin = v.plugin.storage.marginSize ?? 25;
                            // Apply padding-left to the root app container to shift everything safely
                            res.props.style = [res.props.style || {}, { paddingLeft: margin }];
                        }
                    });
                }
            } catch (err) {
                console.error("[MarginFix] Layout patch error:", err);
            }
        },
        onUnload: () => {
            if (unpatch) unpatch();
        }
    };

    exports.default = MarginFix;
    Object.defineProperty(exports, "__esModule", { value: true });
    
    return exports;

})({}, vendetta);
