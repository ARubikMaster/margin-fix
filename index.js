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
            }, "Global Screen Margin (Pixels):"),
            
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
            }, "⚠️ This wraps the absolute root of the app to bypass Discord's strict layout engine. A FULL RESTART is required after changing this number.")
        ]);
    }

    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                const React = v.metro.common.React;
                const ReactNative = v.metro.common.ReactNative;
                
                // Target 1: The React Native App Root (The absolute highest level component)
                const AppContainer = v.metro.findByName("AppContainer", false);
                
                // Target 2: The Safe Area Root (Fallback if AppContainer is obscured)
                const SafeAreaModule = v.metro.findByProps("SafeAreaProvider");

                // The function that forcefully shrinks the app canvas
                const applyGlobalMargin = (res) => {
                    const margin = v.plugin.storage.marginSize ?? 25;
                    return React.createElement(
                        ReactNative.View, 
                        // Flex 1 ensures it fills the screen, padding compresses the app inside it
                        { style: { flex: 1, paddingLeft: margin, backgroundColor: "#000000" } }, 
                        res
                    );
                };

                // Inject the patch into whichever root component we find first
                if (AppContainer && AppContainer.prototype && AppContainer.prototype.render) {
                    unpatch = v.patcher.after("render", AppContainer.prototype, (args, res) => {
                        return applyGlobalMargin(res);
                    });
                } 
                else if (SafeAreaModule && SafeAreaModule.SafeAreaProvider) {
                    unpatch = v.patcher.after("SafeAreaProvider", SafeAreaModule, (args, res) => {
                        return applyGlobalMargin(res);
                    });
                } 
                else {
                    v.ui.toasts.showToast("MarginFix: Could not find Root container!", 1);
                }

            } catch (err) {
                console.error("[MarginFix] Fatal error:", err);
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
