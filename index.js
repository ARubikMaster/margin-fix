(function (exports, metro, patcher) {
    "use strict";

    let unpatch;

    const MarginFix = {
        onLoad: () => {
            // Find the server list component
            const GuildListView = metro.findByName("GuildListView", false);
            
            if (GuildListView) {
                // Inject the margin right after the component renders
                unpatch = patcher.after("default", GuildListView, (args, res) => {
                    if (res && res.props) {
                        res.props.style = [res.props.style, { marginLeft: 25 }];
                    }
                });
            }
        },
        
        onUnload: () => {
            if (unpatch) unpatch();
        }
    };

    // Tell Revenge this is a valid module
    exports.default = MarginFix;
    Object.defineProperty(exports, "__esModule", { value: true });
    
    return exports;

})({}, vendetta.metro, vendetta.patcher);
