var path = require('path'),
    sys = require('sys'),
    fs = require('fs');

var vows = require('vows'),
    assert = require('assert');

var DBPATH = path.join(__dirname, 'database.nbus');

require.paths.unshift(path.join(__dirname, '..'));

var nimbus = require('lib/nimbus');

// Setup database
fs.writeFileSync(DBPATH, [
    {_id: 0, name: 'bob'},
    {_id: 1, name: 'jon'},
    {_id: 2, name: 'bill'},
    {_id: 3, name: 'tuna'}, // get
    {_id: 4, name: 'pope'}  // update
].map(JSON.stringify).join('\n') + '\n');

vows.describe('nimbus').addBatch({
    'A nimbus.DB instance': {
        topic: new(nimbus.DB),

        'with an existing database loaded': {
            topic: function (db) {
                this.db = db;
                return db.load(DBPATH);
            },
            'when performing a *get* with an id': {
                topic: function (db) {
                    return db.get(3);
                },
                'should return the document with that id': function (doc) {
                    assert.isNotNull (doc);
                    assert.equal     (doc.name, 'tuna');
                }
            },
            'when performing a *put* with a new id': {
                topic: function (db) {
                    db.put({_id: 5, name: 'mana'}, this.callback);
                },
                'should store the document in the cache': function (res) {
                    assert.isObject (this.db.store.cache[5]);
                    assert.equal    (this.db.store.cache[5].doc.name, 'mana');
                },
                'should store the document on disk': function (res) {
                    db = new(nimbus.DB);
                    db.load(DBPATH);

                    assert.isObject (db.get(5));
                    assert.equal    (db.get(5).name, 'mana');
                },
                'should set the *persisted* flag to `true`': function (res) {
                    assert.isTrue   (this.db.store.cache[5].persisted);
                }
            },
            'when asking if a key exists': {
                topic: function (db) {
                    return db.exists(2);
                },
                'should reply `true` or `false`': function (res) {
                    assert.isTrue (res);
                }
            },
            'when performing an *update*': {
                topic: function (db) {
                    db.update(4, {name: 'Benedictus'}, this.callback);
                },
                'should modify the document in cache': function (res) {
                    assert.isObject (this.db.store.cache[4]);
                    assert.equal    (this.db.store.cache[4].doc.name, 'Benedictus');
                },
                'should modify the document on disk': function (res) {
                    db = new(nimbus.DB);
                    db.load(DBPATH);

                    assert.isObject (db.get(4));
                    assert.equal    (db.get(4).name, 'Benedictus');
                }
            }
        }
    }
}).export(module);
