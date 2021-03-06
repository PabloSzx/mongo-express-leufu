"use strict";

var utils = require("../utils");

var routes = function(config, socket) {
  var exp = {};

  exp.viewDatabase = function(req, res) {
    req.updateCollections(req.db, req.dbName, function(error) {
      if (error) {
        req.session.error =
          "Could not refresh collections. " + JSON.stringify(error);
        console.error(error);
        return res.redirect("back");
      }

      req.db.stats(function(error, data) {
        if (error) {
          req.session.error = "Could not get stats. " + JSON.stringify(error);
          console.error(error);
          return res.redirect("back");
        }

        var ctx = {
          title: "Viewing Database: " + req.dbName,
          databases: req.databases,
          colls: req.collections[req.dbName],
          grids: req.gridFSBuckets[req.dbName],
          stats: {
            avgObjSize: utils.bytesToSize(data.avgObjSize || 0),
            collections: data.collections,
            dataFileVersion:
              data.dataFileVersion &&
              data.dataFileVersion.major &&
              data.dataFileVersion.minor
                ? data.dataFileVersion.major + "." + data.dataFileVersion.minor
                : null,
            dataSize: utils.bytesToSize(data.dataSize),
            extentFreeListNum:
              data.extentFreeList && data.extentFreeList.num
                ? data.extentFreeList.num
                : null,
            fileSize:
              typeof data.fileSize !== "undefined"
                ? utils.bytesToSize(data.fileSize)
                : null,
            indexes: data.indexes,
            indexSize: utils.bytesToSize(data.indexSize),
            numExtents: data.numExtents.toString(),
            objects: data.objects,
            storageSize: utils.bytesToSize(data.storageSize),
          },
        };
        res.render("database", ctx);
      });
    });
  };

  exp.addDatabase = function(req, res) {
    var name = req.body.database;
    if (!utils.isValidDatabaseName(name)) {
      // TODO: handle error
      console.error("That database name is invalid.");
      req.session.error = "That database name is invalid.";
      return res.redirect("back");
    }

    var ndb = req.mainConn.db(name);

    ndb.createCollection("delete_me", function(err) {
      if (err) {
        //TODO: handle error
        console.error("Could not create collection.");
        req.session.error = "Could not create collection.";
        return res.redirect("back");
      }

      socket.emit("new_database", { db_name: name });

      res.redirect(res.locals.baseHref);

      // ndb.dropCollection('delete_me', function(err) {
      //   if (err) {
      //     //TODO: handle error
      //     console.error('Could not delete collection.');
      //     req.session.error = 'Could not delete collection.';
      //     return res.redirect('back');
      //   }
      //   res.redirect(res.locals.baseHref + 'db/' + name);
      // });
    });
  };

  exp.deleteDatabase = function(req, res) {
    const db_name = req.dbName;
    req.db.dropDatabase(function(err) {
      if (err) {
        //TODO: handle error
        console.error("Could not to delete database.");
        req.session.error = "Failed to delete database.";
        return res.redirect("back");
      }

      socket.emit("dropped_database", {
        db_name,
      });

      res.redirect(res.locals.baseHref);
    });
  };

  return exp;
};

module.exports = routes;
