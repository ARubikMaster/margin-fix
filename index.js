(function (exports, v) {
    "use strict";

    // --- GLOBAL TRACKING STATE ---
    let unpatchApp;
    const guildPatches = [];
    
    let showMargin = false;
    const listeners = new Set();
    const activeStates = new Map();

    // Safely manages multiple server lists overlapping without glitching
    function updateActiveState(id, isActive) {
        activeStates.set(id, isActive);
        let anyActive = false;
        for (let val of activeStates.values()) {
            if (val) anyActive = true;
        }
        if (showMargin !== anyActive) {
            showMargin = anyActive;
            listeners.forEach(l => l(anyActive));
        }
    }

    const React = v.metro.common.React;
    const ReactNative = v.metro.common.ReactNative;

    // --- 1. THE FOCUS TRACKER ---
    // This invisibly attaches to the Server List and watches your screen
    function FocusNotifier({ res }) {
        // Tracker for New Discord (Tabs V2)
        const Nav = v.metro.findByProps("useIsFocused");
        const useIsFocused = Nav ? Nav.useIsFocused : null;
        const isFocused = useIsFocused ? useIsFocused() : null;

        // Tracker for Old Discord (Swipe Drawer)
        const DrawerStore = v.metro.findByStoreName("DrawerStore");
        const [isDrawerOpen, setIsDrawerOpen] = React.useState(DrawerStore ? DrawerStore.isOpen() : false);

        React.useEffect(() => {
            if (!DrawerStore) return;
            const handle = () => setIsDrawerOpen(DrawerStore.isOpen());
            DrawerStore.addChangeListener(handle);
            return () => DrawerStore.removeChangeListener(handle);
        }, []);

        const idRef = React.useRef(Math.random());

        // Report to the Root Wrapper when we enter/leave the server list
        React.useEffect(() => {
            let active = true;
            if (useIsFocused !== null) {
                active = isFocused;
            } else if (DrawerStore) {
                active = isDrawerOpen;
            }
            
            updateActiveState(idRef.current, active);
            return () => updateActiveState(idRef.current, false);
        }, [isFocused, isDrawerOpen]);

        return res; 
    }

    // --- 2. THE DYNAMIC ROOT WRAPPER ---
    // This expands and collapses the margin on the fly
    function RootWrapper({ children }) {
        const [active, setActive] = React.useState(showMargin);
        
        React.useEffect(() => {
            const listener = (val) => setActive(val);
            listeners.add(listener);
            return () => listeners.delete(listener);
        }, []);

        const margin = v.plugin.storage.marginSize ?? 25;
        const color = v.plugin.storage.marginColor || "#1c1814";
        const isSmart = v.plugin.storage.smartMode !== false; // Defaults to true

        // If Smart Mode is OFF, it acts exactly like your previous "Always On" version
        const shouldApply = isSmart ? active : true;

        return React.createElement(
            ReactNative.View, 
            { style: { flex: 1, paddingLeft: shouldApply ? margin : 0, backgroundColor: shouldApply ? color : "transparent" } }, 
            children
        );
    }

    // --- 3. SETTINGS UI ---
    function Settings() {
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
                    React.createElement(ReactNative.Text, { style: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" } }, "Smart Mode (Dynamic)"),
                    React.createElement(ReactNative.Text, { style: { color: "#b9bbbe", fontSize: 12, marginTop: 4 } }, "Only pushes the screen when viewing the Server List. Turn off if the margin randomly disappears.")
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

    // --- 4. CORE PLUGIN ---
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            try {
                // 1. Wrap the Root of the App
                const AppContainer = v.metro.findByName("AppContainer", false);
                const SafeAreaModule = v.metro.findByProps("SafeAreaProvider");

                if (AppContainer && AppContainer.prototype && AppContainer.prototype.render) {
                    unpatchApp = v.patcher.after("render", AppContainer.prototype, (args, res) => {
                        return React.createElement(RootWrapper, null, res);
                    });
                } else if (SafeAreaModule && SafeAreaModule.SafeAreaProvider) {
                    unpatchApp = v.patcher.after("SafeAreaProvider", SafeAreaModule, (args, res) => {
                        return React.createElement(RootWrapper, null, res);
                    });
                }

                // 2. Attach Trackers to the Server List
                const bunny = window.bunny || window.revenge;
                if (!bunny || !bunny.metro || !bunny.metro.findByNameLazy) return;

                const targets = ["Guilds", "GuildListView", "GuildsNavBar", "GuildsTree"];
                targets.forEach(name => {
                    const lazyProxy = bunny.metro.findByNameLazy(name, false);
                    if (lazyProxy) {
                        const p = v.patcher.after("default", lazyProxy, (args, res) => {
                            return React.createElement(FocusNotifier, { res });
                        });
                        guildPatches.push(p);
                    }
                });

            } catch (err) {
                console.error("[MarginFix] Fatal error:", err);
            }
        },
        onUnload: () => {
            if (unpatchApp) unpatchApp();
            guildPatches.forEach(p => p());
        }
    };

    exports.default = MarginFix;
    Object.defineProperty(exports, "__esModule", { value: true });
    
    return exports;

})({}, vendetta);
