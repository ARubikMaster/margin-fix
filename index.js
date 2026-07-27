(function (exports, v) {
    "use strict";

    const React = v.metro.common.React;
    const ReactNative = v.metro.common.ReactNative;

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
            })
        ]);
    }

    // 2. Core Plugin
    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            const patches = [];
            try {
                const bunny = window.bunny || window.revenge;
                if (!bunny || !bunny.metro || !bunny.metro.findByNameLazy) return;

                const targets = ["GuildListView", "Guilds", "GuildList", "NavigableGuilds"];
                
                targets.forEach(name => {
                    const lazyProxy = bunny.metro.findByNameLazy(name, false);
                    
                    const patch = v.patcher.after("default", lazyProxy, (args, res) => {
                        if (res) {
                            const margin = v.plugin.storage.marginSize ?? 25;
                            
                            // THE FIX: Forcefully wrap Discord's component in our own View
                            return React.createElement(
                                ReactNative.View, 
                                { style: { marginLeft: margin, flex: 1 } }, 
                                res // Shove the original component inside our new margin box
                            );
                        }
                    });
                    
                    patches.push(patch);
                });

                unpatchAll = () => patches.forEach(p => p());

            } catch (err) {
                console.error("[MarginFix] Patch Error:", err);
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
