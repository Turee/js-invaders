(ns js-invaders2.db.core
  (:use korma.core
        [korma.db :only (defdb)])
  (:require [js-invaders2.db.schema :as schema]))

(defdb db schema/db-spec)

(defentity scores)

(defn add-score [name score]
    (insert scores
      (values {
        :name name
        :score score
        :timestamp (new java.util.Date)}))
    (let [min-score-top10 (:score
                              (first (select scores
                                 (order :score :DESC)
                                 (offset 10)
                                 (limit 1))))]
      (println min-score-top10)
      (if min-score-top10
        (delete scores (where {:score [< min-score-top10]}) ))))

(defn get-scores []  
  (select scores
    (order :score :DESC)))

