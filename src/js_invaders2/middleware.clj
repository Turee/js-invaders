(ns js-invaders2.middleware
  (:require [taoensso.timbre :as timbre]
            [selmer.parser :as parser]
            [environ.core :refer [env]]
            [selmer.middleware :refer [wrap-error-page]]
            [prone.middleware :refer [wrap-exceptions]]
            [noir-exception.core :refer [wrap-internal-error]]
            [js-invaders2.routes.home :as routes]))

(defn log-request [handler]
  (fn [req]
    (timbre/debug req)
    (handler req)))

(def development-middleware
  [wrap-error-page
   wrap-exceptions])

(def production-middleware
  [#(wrap-internal-error % :log (fn [e] (timbre/error e)))])

; (def app (util/middleware/app-handler
;             routes/api-routes
;             :formats [:json]))
; (defn json-response-middleware [handler]
;   (fn [request]
;     (let [response (handler request)]
;       (response/json (:body response)))))

(defn load-middleware []
  (concat (when (env :dev) development-middleware)
          production-middleware))
