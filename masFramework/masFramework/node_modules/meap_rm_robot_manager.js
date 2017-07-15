var cluster = require('cluster');
var numCPUs = global.single ? 1 : global.cluster;
var MOB_Ada_Service = require("meap_rm_mobile_adapter_service");
var RBT_Man_Context = require("meap_rm_robot_manager_context");
var copyright = require("meap_copyright");

function run(path, mod) {
    LOG1("[ROBM]INFO: ", "************************ROBOT MANAGER START**********************************");
    copyright.checkCopyright(function (err, result) {
        if (err == 1 && !global.DEBUG) {
            if (cluster.isMaster && numCPUs > 1) {
                LOG2("[meap_rm_robot_manager][run] INFO: MEAP RM START - WORKERS NUM(", numCPUs, ")");
                for (var i = 0; i < numCPUs; i++) {
                    cluster.fork();
                }
                cluster.on("exit", function (worker, code, singal) {
                    LOG1("[meap_rm_robot_manager][run] WORKER DIED");
                    cluster.fork();
                });
            } else {
                LOG1("[meap_rm_robot_manager][run] INFO: MEAP RM WORKER RUNNING ");
                var RMContext = new RBT_Man_Context.Context(path);
                RMContext.CopyRight = true;
                MOB_Ada_Service.Runner(RMContext);
            }
        } else {
            var RMContext = new RBT_Man_Context.Context(path);
            RMContext.CopyRight = false;
            MOB_Ada_Service.Runner(RMContext);
        }
    });
}
exports.Runner = run;
exports.Context = RBT_Man_Context.Context;
