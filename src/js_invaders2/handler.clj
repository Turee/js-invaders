(ns js-invaders2.handler
  (:require [compojure.core :refer [defroutes]]
            
            [js-invaders2.routes.home :as routes]
            [js-invaders2.middleware :refer [load-middleware]]
            [js-invaders2.session-manager :as session-manager]
            [noir.response :refer [redirect]]
            [noir.util.middleware :refer [app-handler]]
            [compojure.route :as route]
            [taoensso.timbre :as timbre]
            [taoensso.timbre.appenders.rotor :as rotor]
            [selmer.parser :as parser]
            [environ.core :refer [env]]
            [cronj.core :as cronj]
            [js-invaders2.db.schema :as schema]))

(defroutes base-routes
  (route/resources "/")
  (route/not-found "Not Found"))



(defn init
  "init will be called once when
   app is deployed as a servlet on
   an app server such as Tomcat
   put any initialization code here"
  []
  (timbre/set-config!
    [:appenders :rotor]
    {:min-level :info
     :enabled? true
     :async? false ; should be always false for rotor
     :max-message-per-msecs nil
     :fn rotor/appender-fn})

  (timbre/set-config!
    [:shared-appender-config :rotor]
    {:path "js_invaders2.log" :max-size (* 512 1024) :backlog 10})
  (if-not (schema/initialized?) (schema/create-tables))
  (if (env :dev) (parser/cache-off!))
  ;;start the expired session cleanup job
  (cronj/start! session-manager/cleanup-job)
  (timbre/info "js-invaders2 started successfully"))

(defn destroy
  "destroy will be called when your application
   shuts down, put any clean up code here"
  []
  (timbre/info "js-invaders2 is shutting down...")
  (cronj/shutdown! session-manager/cleanup-job)
  (timbre/info "shutdown complete!"))

(def app (app-handler
           ;; add your application routes here
           [routes/api-routes routes/home-routes base-routes]
           ;; add custom middleware here
           :middleware (load-middleware)
           ;; timeout sessions after 30 minutes
           :session-options {:timeout (* 60 30)
                             :timeout-response (redirect "/")}
           ;; add access rules here
           :access-rules []
           ;; serialize/deserialize the following data formats
           ;; available formats:
           ;; :json :json-kw :yaml :yaml-kw :edn :yaml-in-html
           :formats [:json-kw :edn]))
