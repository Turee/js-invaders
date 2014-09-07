(ns js-invaders2.db.schema
  (:require [clojure.java.jdbc :as sql]
            [noir.io :as io]
            [korma.db :as korma]
            [environ.core :refer [env]]))

(def db-store "site.db")
(defn conn-details-from-url
  [url]
  (let [[[match user password host port database]] (re-seq #"postgres\:\/\/(.*)\:(.*)\@(.*)\:(.*)\/(.*)" url)] {
      :host host
      :port port
      :db database
      :user user
      :password password}))


(def db-spec (korma/postgres (conn-details-from-url (env :database-url))))
            
      


(defn initialized?
  "checks to see if the database schema is present"
  []
  false)
  
  

(defn create-scores-table []
    "Creates table for scores"
    (sql/db-do-commands
      db-spec
      (sql/create-table-ddl
        :scores
        [:id "SERIAL PRIMARY KEY"]
        [:timestamp :timestamp]
        [:name "varchar(30)"]
        [:score "integer"]))
    (sql/db-do-prepared db-spec
      "CREATE INDEX score_index ON scores (score)"))

(defn create-tables
  "creates the database tables used by the application"
  []
  (try
    (create-scores-table)
    (catch Exception e (println (.getMessage e)))))

