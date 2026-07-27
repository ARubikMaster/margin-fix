(function (exports, v) {
    "use strict";

    const React = v.metro.common.React;
    const ReactNative = v.metro.common.ReactNative;
    const { showToast } = v.ui.toasts;

    let unpatchAll;

    // 1. Settings UI
    function Settings() {
        if (v.plugin.storage.marginSize === undefined) {
            v.plugin.storage.marginSize = 25;
        }

        const [marginText, setMarginText] = React.useState(String(v.plugin.storage.marginSize));

        return React.createElement(ReactNative.View, { style: { padding: 16, flex: 1 } }, [
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
                    setMarginText(text);
                    const num = parseInt(text.replace(/[^0-9]/g, ''));
                    v.plugin.storage.marginSize = isNaN(num) ? 0 : num;
                }
            }),

            React.createElement(ReactNative.Text, { 
                key: "hint", 
                style: { color: "#b9bbbe", fontSize: 14, marginTop: 12 } 
            }, "⚠️ Note: Most phone screens are only 400 pixels wide. If you set this to 700, you will push the server list completely off the screen! Try 25 or 50 first.")
        ]);
    }

    // 2. Core Plugin
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            const patches = [];
            try {
                // Hook into Revenge's lazy-loader API
                const bunny = window.bunny || window.revenge;
                if (!bunny || !bunny.metro || !bunny.metro.findByNameLazy) {
                    showToast("MarginFix: Missing Lazy Loader API", 1);
                    return;
                }

                // Cast a net for every possible name Discord uses for the Server List
                const targets = ["GuildListView", "Guilds", "GuildList", "NavigableGuilds"];
                
                targets.forEach(name => {
                    // Wait in the shadows for the component to load
                    const lazyProxy = bunny.metro.findByNameLazy(name, false);
                    
                    // Apply the patch the millisecond it spawns
                    const patch = v.patcher.after("default", lazyProxy, (args, res) => {
                        if (res && res.props) {
                            const margin = v.plugin.storage.marginSize ?? 25;
                            // Safely append the margin to the existing style array
                            res.props.style = [res.props.style || {}, { marginLeft: margin }];
                        }
                    });
                    
                    patches.push(patch);
                });

                unpatchAll = () => patches.forEach(p => p());

            } catch (err) {
                console.error("[MarginFix] Crash prevented:", err);
                showToast("MarginFix: Patch Failed", 1);
            }
        },
        
        onUnload: () => {
            if (unpatchAll) unpatchAll();
        }
    };

    exports.default = MarginFix;
    Object.defineProperty(exports, "__esModule", { value: true });
    
    return exports;

})({}, vendetta);
