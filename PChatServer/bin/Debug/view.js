/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="viewModel.ts" />
var PChatView;
(function (_PChatView) {
    var PChatView = (function () {
        function PChatView(viewModel) {
            this.viewModel = viewModel;
            viewModel.addPropertyChangedListener(function (prop) {
                if (prop.type === 2 /* ChatMessage */) {
                    var tprop = prop;
                    document.getElementById('content').innerHTML = tprop.sender.name + ":" + tprop.message;
                }
            });
        }
        return PChatView;
    })();
    _PChatView.PChatView = PChatView;
})(PChatView || (PChatView = {}));
//# sourceMappingURL=view.js.map
