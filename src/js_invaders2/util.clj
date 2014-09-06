(ns js-invaders2.util
  (:require [noir.io :as io]
            [markdown.core :as md]))

(defn md->html
  "reads a markdown file from public/md and returns an HTML string"
  [filename]
  (md/md-to-html-string (io/slurp-resource filename)))
(defn escape-html
  "Change special characters into HTML character entities."
  [text]
  (.. #^String (str text)
    (replace "&" "&amp;")
    (replace "<" "&lt;")
    (replace ">" "&gt;")
    (replace "\"" "&quot;")))