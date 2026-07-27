let unpatch;

module.exports = {
    onLoad: () => {
        const { metro, patcher } = window.vendetta;
        const GuildListView = metro.findByName("GuildListView", false);
        
        if (GuildListView) {
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
