(function (exports, v) {
    "use strict";

    let unpatch;

    // 1. Settings UI
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
            }, "Screen Edge Offset (Pixels):"),
            
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
            }, "⚠️ This hacks the native Safe Area Insets to trick Discord into thinking your phone has a massive left notch. It completely bypasses Discord's strict layout engine!")
        ]);
    }

    // 2. Core Plugin
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                // Find React Native's core Safe Area module
                const SafeArea = v.metro.findByProps("useSafeAreaInsets");
                
                if (!SafeArea || !SafeArea.useSafeAreaInsets) {
                    v.ui.toasts.showToast("MarginFix: SafeArea API not found", 1);
                    return;
                }

                // Intercept every time Discord asks the phone where the edges are
                unpatch = v.patcher.after("useSafeAreaInsets", SafeArea, (args, res) => {
                    if (res) {
                        const margin = v.plugin.storage.marginSize ?? 25;
                        
                        // Forcefully inject our custom margin into the left boundary
                        return {
                            ...res,
                            left: (res.left || 0) + margin
                        };
                    }
                    return res;
                });

            } catch (err) {
                console.error("[MarginFix] SafeArea patch error:", err);
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
