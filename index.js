let unpatch;

export default {
    onLoad: () => {
        // Access the global API injected by Revenge/Vendetta
        const { metro, patcher } = window.vendetta;
        
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
}
