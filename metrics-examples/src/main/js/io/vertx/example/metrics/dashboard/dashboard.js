var MetricsService = require("vertx-dropwizard-js/metrics_service");
var Router = require("vertx-apex-js/router");
var SockJSHandler = require("vertx-apex-js/sock_js_handler");
var StaticHandler = require("vertx-apex-js/static_handler");

var service = MetricsService.create(vertx);

var router = Router.router(vertx);

// Allow outbound traffic to the news-feed address

var options = {
  "outboundPermitteds" : [
    {
      "address" : "metrics"
    }
  ]
};

router.route("/eventbus/*").handler(SockJSHandler.create(vertx).bridge(options).handle);

// Serve the static resources
router.route().handler(StaticHandler.create().handle);

var httpServer = vertx.createHttpServer();
httpServer.requestHandler(router.accept).listen(8080);

// Send a metrics events every second
vertx.setPeriodic(1000, function (t) {
  var metrics = service.getMetricsSnapshot(vertx.eventBus());
  vertx.eventBus().publish("metrics", metrics);
});

// Send some messages
var random = new (Java.type("java.util.Random"))();
vertx.eventBus().consumer("whatever", function (msg) {
  vertx.setTimer(10 + random.nextInt(50), function (id) {
    vertx.eventBus().send("whatever", "hello");
  });
});
vertx.eventBus().send("whatever", "hello");
