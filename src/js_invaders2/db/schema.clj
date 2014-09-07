(ns js-invaders2.db.schema
  (:require [clojure.java.jdbc :as sql]
            [noir.io :as io]
            [korma.db :as korma]
            [clojure.data.json :as json]
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


(def db-spec (cond
                (env :dev)
                  {:classname "org.h2.Driver"
                  :subprotocol "h2"
                  :subname (str (io/resource-path) db-store)
                  :user "sa"
                  :password ""
                  :make-pool? true
                  :naming {:keys clojure.string/lower-case
                           :fields clojure.string/upper-case}}
                :else
                  (conn-details-from-url (env :database-url))))
            
      


(defn initialized?
  "checks to see if the database schema is present"
  []
  (cond 
    (env :dev)
      (.exists (new java.io.File (str (io/resource-path) db-store ".mv.db")))
    :else
      false
    ))
  
  

(defn create-scores-table []
    "Creates table for scores"
    (sql/db-do-commands
      db-spec
      (sql/create-table-ddl
        :scores
        [:id "INTEGER PRIMARY KEY AUTO_INCREMENT"]
        [:timestamp :timestamp]
        [:name "varchar(30)"]
        [:score "integer"]))
    (sql/db-do-prepared db-spec
      "CREATE INDEX score_index ON scores (score)"))

(defn create-tables
  "creates the database tables used by the application"
  []
  (create-scores-table))

