(function (exports, v) {
    "use strict";

    let unpatch;

    // --- 1. SETTINGS UI ---
    function Settings() {
        const React = v.metro.common.React;
        const ReactNative = v.metro.common.ReactNative;

        if (v.plugin.storage.marginSize === undefined) v.plugin.storage.marginSize = 25;
        if (v.plugin.storage.marginColor === undefined) v.plugin.storage.marginColor = "#1c1814";
        if (v.plugin.storage.smartMode === undefined) v.plugin.storage.smartMode = true;
        if (v.plugin.storage.showDebug === undefined) v.plugin.storage.showDebug = true;

        const [marginText, setMarginText] = React.useState(String(v.plugin.storage.marginSize));
        const [colorText, setColorText] = React.useState(v.plugin.storage.marginColor);
        const [smartMode, setSmartMode] = React.useState(v.plugin.storage.smartMode);
        const [showDebug, setShowDebug] = React.useState(v.plugin.storage.showDebug);

        return React.createElement(ReactNative.ScrollView, { style: { padding: 16, flex: 1 } }, [
            
            // --- DEBUG OVERLAY TOGGLE ---
            React.createElement(ReactNative.View, { key: "debugToggle", style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, backgroundColor: "#202225", padding: 12, borderRadius: 8 } }, [
                React.createElement(ReactNative.View, { style: { flex: 1, paddingRight: 16 } }, [
                    React.createElement(ReactNative.Text, { style: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" } }, "Show On-Screen Debug Overlay"),
                    React.createElement(ReactNative.Text, { style: { color: "#b9bbbe", fontSize: 12, marginTop: 4 } }, "Displays a small green badge at the top of your screen showing Discord's current internal route name in real-time.")
                ]),
                React.createElement(ReactNative.Switch, {
                    value: showDebug,
                    onValueChange: (val) => {
                        setShowDebug(val);
                        v.plugin.storage.showDebug = val;
                    }
                })
            ]),

            // --- SMART MODE TOGGLE ---
            React.createElement(ReactNative.View, { key: "smartToggle", style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, backgroundColor: "#202225", padding: 12, borderRadius: 8 } }, [
                React.createElement(ReactNative.View, { style: { flex: 1, paddingRight: 16 } }, [
                    React.createElement(ReactNative.Text, { style: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" } }, "Smart Mode (Auto-Hide)"),
                    React.createElement(ReactNative.Text, { style: { color: "#b9bbbe", fontSize: 12, marginTop: 4 } }, "Automatically hides the margin when you enter a chat screen.")
                ]),
                React.createElement(ReactNative.Switch, {
                    value: smartMode,
                    onValueChange: (val) => {
                        setSmartMode(val);
                        v.plugin.storage.smartMode = val;
                    }
                })
            ]),

            // --- MARGIN SIZE ---
            React.createElement(ReactNative.Text, { key: "labelSize", style: { color: "#FFFFFF", fontSize: 16, marginBottom: 8, fontWeight: "bold" } }, "Global Screen Margin (Pixels):"),
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

            // --- COLOR CODE ---
            React.createElement(ReactNative.Text, { key: "labelColor", style: { color: "#FFFFFF", fontSize: 16, marginBottom: 8, fontWeight: "bold" } }, "Bar Color (Hex Code):"),
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

    // --- 2. THE DYNAMIC ROOT WRAPPER ---
    function RootWrapper({ children }) {
        const React = v.metro.common.React;
        const ReactNative = v.metro.common.ReactNative;
        
        const [isMainScreen, setIsMainScreen] = React.useState(true);
        const [routeName, setRouteName] = React.useState("Booting...");

        React.useEffect(() => {
            const navModule = v.metro.findByProps("getRootNavigationRef");
            
            const checkState = () => {
                let active = true; 

                if (!navModule) {
                    setRouteName("Nav API Missing");
                } else if (!navModule.getRootNavigationRef) {
                    setRouteName("Ref API Missing");
                } else {
                    const nav = navModule.getRootNavigationRef();
                    if (!nav || !nav.isReady || !nav.isReady()) {
                        setRouteName("Router Not Ready");
                    } else {
                        const route = nav.getCurrentRoute();
                        if (route && route.name) {
                            setRouteName(route.name);
                            
                            const name = route.name.toLowerCase();
                            
                            // BLACKLIST: Hides the margin on these screens
                            if (name.includes("chat") || name.includes("settings") || name.includes("profile") || name.includes("thread")) {
                                active = false;
                            }
                        } else {
                            setRouteName("Unknown Route");
                        }
                    }
                }

                setIsMainScreen(active);
            };

            const interval = setInterval(checkState, 200);
            checkState();
            return () => clearInterval(interval);
        }, []);

        const margin = v.plugin.storage.marginSize ?? 25;
        const color = v.plugin.storage.marginColor || "#1c1814";
        const isSmart = v.plugin.storage.smartMode !== false;
        const showDebug = v.plugin.storage.showDebug !== false;

        const shouldApply = isSmart ? isMainScreen : true;

        return React.createElement(
            ReactNative.View, 
            { style: { flex: 1, paddingLeft: shouldApply ? margin : 0, backgroundColor: shouldApply ? color : "transparent" } }, 
            [
                children,

                // --- FLOATING DEBUG OVERLAY ---
                showDebug && React.createElement(
                    ReactNative.View,
                    {
                        key: "debugOverlay",
                        pointerEvents: "none",
                        style: {
                            position: "absolute",
                            top: 40,
                            right: 12,
                            backgroundColor: "rgba(0, 0, 0, 0.85)",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: "#43b581",
                            zIndex: 999999,
                            elevation: 999999
                        }
                    },
                    React.createElement(
                        ReactNative.Text,
                        { style: { color: "#43b581", fontSize: 12, fontWeight: "bold", fontFamily: "monospace" } },
                        "Route: " + routeName
                    )
                )
            ]
        );
    }

    // --- 3. CORE PLUGIN ---
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                const AppContainer = v.metro.findByName("AppContainer", false);
                const SafeAreaModule = v.metro.findByProps("SafeAreaProvider");

                if (AppContainer && AppContainer.prototype && AppContainer.prototype.render) {
                    unpatch = v.patcher.after("render", AppContainer.prototype, (args, res) => {
                        return v.metro.common.React.createElement(RootWrapper, null, res);
                    });
                } 
                else if (SafeAreaModule && SafeAreaModule.SafeAreaProvider) {
                    unpatch = v.patcher.after("SafeAreaProvider", SafeAreaModule, (args, res) => {
                        return v.metro.common.React.createElement(RootWrapper, null, res);
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
