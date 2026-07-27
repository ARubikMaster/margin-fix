(function (exports, v) {
    "use strict";

    let unpatch;

    function Settings() {
        const React = v.metro.common.React;
        const ReactNative = v.metro.common.ReactNative;

        // Default to 25px margin and your specific brownish theme color
        if (v.plugin.storage.marginSize === undefined) v.plugin.storage.marginSize = 25;
        if (v.plugin.storage.marginColor === undefined) v.plugin.storage.marginColor = "#1c1814";

        const [marginText, setMarginText] = React.useState(String(v.plugin.storage.marginSize));
        const [colorText, setColorText] = React.useState(v.plugin.storage.marginColor);

        return React.createElement(ReactNative.View, { style: { padding: 16, flex: 1 } }, [
            
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
                    // Update the text box on your screen
                    setColorText(text);
                    
                    // SAFETY CHECK: Only push the color to Discord if it is a valid Hex Code
                    // This prevents React Native from crashing if you type an incomplete color!
                    if (/^#([0-9A-F]{3,8})$/i.test(text.trim())) {
                        v.plugin.storage.marginColor = text.trim();
                    }
                }
            }),

            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 12 } 
            }, "Type any hex color code. The bar will seamlessly update in the background!")
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
                    
                    return React.createElement(
                        ReactNative.View, 
                        // The backgroundColor is dynamically pulled from your textbox!
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
