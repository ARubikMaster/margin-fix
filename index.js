(function (exports, v) {
    "use strict";

    let unpatch;

    function Settings() {
        const React = v.metro.common.React;
        const ReactNative = v.metro.common.ReactNative;

        if (v.plugin.storage.marginSize === undefined) v.plugin.storage.marginSize = 25;
        if (v.plugin.storage.marginColor === undefined) v.plugin.storage.marginColor = "#1c1814";

        const [marginText, setMarginText] = React.useState(String(v.plugin.storage.marginSize));
        const [colorText, setColorText] = React.useState(v.plugin.storage.marginColor);

        return React.createElement(ReactNative.ScrollView, { style: { padding: 16, flex: 1 } }, [
            
            React.createElement(ReactNative.Text, { 
                key: "warning", 
                style: { color: "#f04747", fontSize: 14, marginBottom: 16, fontWeight: "bold" } 
            }, "Smart Mode has been removed for stability. Using rock-solid Always-On mode."),

            // --- MARGIN TEXTBOX ---
            React.createElement(ReactNative.Text, { 
                key: "labelSize", 
                style: { color: "#FFFFFF", fontSize: 16, marginBottom: 8, fontWeight: "bold" } 
            }, "Global Screen Margin (Pixels):"),
            
            React.createElement(ReactNative.TextInput, {
                key: "inputSize",
                style: { backgroundColor: "#202225", color: "#FFFFFF", padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 24 },
                keyboardType: "numeric",
                value: marginText,
                onChangeText: (text) => {
                    setMarginText(text);
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    v.plugin.storage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            // --- COLOR TEXTBOX ---
            React.createElement(ReactNative.Text, { 
                key: "labelColor", 
                style: { color: "#FFFFFF", fontSize: 16, marginBottom: 8, fontWeight: "bold" } 
            }, "Bar Color (Hex Code):"),
            
            React.createElement(ReactNative.TextInput, {
                key: "inputColor",
                style: { backgroundColor: "#202225", color: "#FFFFFF", padding: 12, borderRadius: 8, fontSize: 16 },
                value: colorText,
                placeholder: "#1c1814",
                placeholderTextColor: "#72767d",
                onChangeText: (text) => {
                    setColorText(text);
                    if (/^#([0-9A-F]{3,8})$/i.test(text.trim())) {
                        v.plugin.storage.marginColor = text.trim();
                    }
                }
            })
        ]);
    }

    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                const React = v.metro.common.React;
                const ReactNative = v.metro.common.ReactNative;
                
                const AppContainer = v.metro.findByName("AppContainer", false);
                const SafeAreaModule = v.metro.findByProps("SafeAreaProvider");

                const applyGlobalMargin = (res) => {
                    const margin = v.plugin.storage.marginSize ?? 25;
                    const color = v.plugin.storage.marginColor || "#1c1814";
                    
                    // If margin is 0, don't render the color box at all
                    if (margin <= 0) return res;

                    return React.createElement(
                        ReactNative.View, 
                        { style: { flex: 1, paddingLeft: margin, backgroundColor: color } }, 
                        res
                    );
                };

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
