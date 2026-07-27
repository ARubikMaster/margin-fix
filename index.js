(function (exports, v) {
    "use strict";

    let unpatchAll;

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
            }, "Server List Offset (Pixels):"),
            
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
            }, "Uses GPU translation to forcefully slide the server list right, bypassing layout restrictions.")
        ]);
    }

    const MarginFix = {
        settings: Settings,
        onLoad: () => {
            const patches = [];
            try {
                const bunny = window.bunny || window.revenge;
                if (!bunny || !bunny.metro || !bunny.metro.findByNameLazy) return;

                // Widen the net to catch the newest unified Discord codebase components
                const targets = ["GuildsTree", "GuildsNavBar", "GuildListView", "Guilds"];
                
                targets.forEach(name => {
                    const lazyProxy = bunny.metro.findByNameLazy(name, false);
                    
                    const patch = v.patcher.after("default", lazyProxy, (args, res) => {
                        if (res && res.props) {
                            const margin = v.plugin.storage.marginSize ?? 25;
                            
                            // THE FIX: GPU Transform. 
                            // This translates the pixels AFTER the layout is drawn, making it unblockable.
                            res.props.style = [
                                res.props.style || {}, 
                                { transform: [{ translateX: margin }] }
                            ];
                        }
                    });
                    
                    patches.push(patch);
                });

                unpatchAll = () => patches.forEach(p => p());

            } catch (err) {
                console.error("[MarginFix] Patch error:", err);
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
