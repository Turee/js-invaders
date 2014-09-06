(ns js-invaders2.routes.home
  (:require [compojure.core :refer :all]
  			[clojure.core :refer :all]
  			[clojure.string :as string]
            [js-invaders2.layout :as layout]
            [js-invaders2.util :as util]
            [js-invaders2.db.core :as db]
            [clojure.math.numeric-tower :as math]
            [compojure.handler :refer [api]]
            [noir.response :as response]))

(defn home-page []
  (layout/render
    "index.html"))

(defn scores []
	(response/json (db/get-scores)))

(defn add-score [name score]
	(let [name (string/trim name)]
		(cond
			(empty? name)
			(response/json { :error "Please give a name"})

			(> (count name) 30)
			(response/json { :error "Name length must be less than 30 characters"})		
			
			(empty? score)
			(response/json { :error "There seems to be a bug in the application"})
			
			:else
			(do 
				(db/add-score name ((comp math/round read-string) score))
				(response/json {})))))
	

(defroutes home-routes
  (GET "/" [] (home-page)))
(defroutes api-routes
	(GET "/apiv1/scores" [] (scores))
  	(POST "/apiv1/scores" [name score] (add-score name score)))

(api api-routes)