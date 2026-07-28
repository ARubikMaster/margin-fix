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

        const [marginText, setMarginText] = React.useState(String(v.plugin.storage.marginSize));
        const [colorText, setColorText] = React.useState(v.plugin.storage.marginColor);
        const [smartMode, setSmartMode] = React.useState(v.plugin.storage.smartMode);

        return React.createElement(ReactNative.ScrollView, { style: { padding: 16, flex: 1 } }, [
            
            // Smart Mode Toggle
            React.createElement(ReactNative.View, { key: "smartToggle", style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, backgroundColor: "#202225", padding: 12, borderRadius: 8 } }, [
                React.createElement(ReactNative.View, { style: { flex: 1, paddingRight: 16 } }, [
                    React.createElement(ReactNative.Text, { style: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" } }, "Smart Tracker (Router Mode)"),
                    React.createElement(ReactNative.Text, { style: { color: "#b9bbbe", fontSize: 12, marginTop: 4 } }, "Dynamically reads Discord's global navigation to only push the screen when viewing the Server List.")
                ]),
                React.createElement(ReactNative.Switch, {
                    value: smartMode,
                    onValueChange: (val) => {
                        setSmartMode(val);
                        v.plugin.storage.smartMode = val;
                    }
                })
            ]),

            // Margin Size
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

            // Color Code
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
        
        const [isServerList, setIsServerList] = React.useState(false);

        React.useEffect(() => {
            // Find Discord's Global Navigation Systems
            const DrawerStore = v.metro.findByStoreName("DrawerStore");
            const navModule = v.metro.findByProps("getNavigationRef");
            
            const checkState = () => {
                let active = false;

                // 1. Check Old UI (Swipe Drawer)
                if (DrawerStore && DrawerStore.isOpen()) {
                    active = true;
                }

                // 2. Check New UI (Tabs V2 Router)
                if (navModule && navModule.getNavigationRef) {
                    const nav = navModule.getNavigationRef();
                    if (nav && nav.isReady && nav.isReady()) {
                        const route = nav.getCurrentRoute();
                        // These are the names Discord uses internally when looking at servers
                        if (route && (route.name === "Guilds" || route.name === "Home" || route.name === "Panels")) {
                            active = true;
                        }
                    }
                }

                setIsServerList(active);
            };

            // Run an unkillable background check 4 times a second
            const interval = setInterval(checkState, 250);
            
            // Initial check
            checkState();

            return () => clearInterval(interval);
        }, []);

        const margin = v.plugin.storage.marginSize ?? 25;
        const color = v.plugin.storage.marginColor || "#1c1814";
        const isSmart = v.plugin.storage.smartMode !== false;

        // If Smart Mode is OFF, apply margin everywhere. If ON, only apply when isServerList is true.
        const shouldApply = isSmart ? isServerList : true;

        return React.createElement(
            ReactNative.View, 
            { style: { flex: 1, paddingLeft: shouldApply ? margin : 0, backgroundColor: shouldApply ? color : "transparent" } }, 
            children
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
