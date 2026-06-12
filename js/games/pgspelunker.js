/* ══ PG Source Spelunker — PostgreSQL Source Tree Quiz ══
   Players identify which file in the PostgreSQL source tree
   defines a given function/symbol. 3 lives, endless rounds,
   streak multiplier, speed bonus.
   ═════════════════════════════════════════════════════════ */

const PGSpelunker = (() => {

  /* ══════════════════════════════════════════════════════
     QUESTION DATABASE
     Each entry: { symbol, type, desc, file, category, distractors[] }
     All paths are real PostgreSQL source locations.
     ══════════════════════════════════════════════════════ */
  const Q = [
    /* ── Executor ── */
    {
      symbol: 'ExecHashJoin',
      type: 'function', desc: 'Executes a hash join between two relations',
      file: 'src/backend/executor/nodeHashjoin.c', category: 'Executor',
      distractors: [
        'src/backend/access/hash/hashfunc.c',
        'src/backend/optimizer/path/joinpath.c',
        'src/backend/utils/hash/dynahash.c',
      ],
    },
    {
      symbol: 'ExecSeqScan',
      type: 'function', desc: 'Performs a sequential scan, fetching tuples in physical order',
      file: 'src/backend/executor/nodeSeqscan.c', category: 'Executor',
      distractors: [
        'src/backend/access/heap/heapam.c',
        'src/backend/executor/execMain.c',
        'src/backend/storage/buffer/bufmgr.c',
      ],
    },
    {
      symbol: 'ExecSort',
      type: 'function', desc: 'Implements the Sort executor node using tuplesort',
      file: 'src/backend/executor/nodeSort.c', category: 'Executor',
      distractors: [
        'src/backend/utils/sort/tuplesort.c',
        'src/backend/executor/execMain.c',
        'src/backend/optimizer/plan/planner.c',
      ],
    },
    {
      symbol: 'ExecBitmapHeapScan',
      type: 'function', desc: 'Scans a heap using a bitmap produced by an index scan',
      file: 'src/backend/executor/nodeBitmapHeapscan.c', category: 'Executor',
      distractors: [
        'src/backend/executor/nodeBitmapIndexscan.c',
        'src/backend/access/heap/heapam.c',
        'src/backend/executor/nodeIndexscan.c',
      ],
    },
    {
      symbol: 'ExecIndexScan',
      type: 'function', desc: 'Executes a plain index scan on a relation',
      file: 'src/backend/executor/nodeIndexscan.c', category: 'Executor',
      distractors: [
        'src/backend/access/index/indexam.c',
        'src/backend/executor/nodeBitmapIndexscan.c',
        'src/backend/catalog/index.c',
      ],
    },
    {
      symbol: 'ExecMergeJoin',
      type: 'function', desc: 'Executes a merge join between two pre-sorted inputs',
      file: 'src/backend/executor/nodeMergejoin.c', category: 'Executor',
      distractors: [
        'src/backend/executor/nodeHashjoin.c',
        'src/backend/optimizer/path/joinpath.c',
        'src/backend/executor/nodeNestloop.c',
      ],
    },
    {
      symbol: 'ExecutorRun',
      type: 'function', desc: 'Runs a query plan tree, fetching rows up to a count limit',
      file: 'src/backend/executor/execMain.c', category: 'Executor',
      distractors: [
        'src/backend/tcop/pquery.c',
        'src/backend/executor/execProcnode.c',
        'src/backend/optimizer/plan/planner.c',
      ],
    },
    {
      symbol: 'ExecModifyTable',
      type: 'function', desc: 'Handles INSERT / UPDATE / DELETE DML in the executor',
      file: 'src/backend/executor/nodeModifyTable.c', category: 'Executor',
      distractors: [
        'src/backend/commands/tablecmds.c',
        'src/backend/executor/execMain.c',
        'src/backend/access/heap/heapam.c',
      ],
    },

    /* ── Heap / Access ── */
    {
      symbol: 'heap_insert',
      type: 'function', desc: 'Inserts a new tuple into a heap (table) relation',
      file: 'src/backend/access/heap/heapam.c', category: 'Heap Access',
      distractors: [
        'src/backend/catalog/heap.c',
        'src/backend/executor/nodeModifyTable.c',
        'src/backend/access/common/heaptuple.c',
      ],
    },
    {
      symbol: 'heap_update',
      type: 'function', desc: 'Updates an existing tuple in a heap relation (MVCC-style)',
      file: 'src/backend/access/heap/heapam.c', category: 'Heap Access',
      distractors: [
        'src/backend/commands/tablecmds.c',
        'src/backend/executor/nodeModifyTable.c',
        'src/backend/access/common/heaptuple.c',
      ],
    },
    {
      symbol: 'heap_delete',
      type: 'function', desc: 'Marks a tuple as deleted in a heap relation',
      file: 'src/backend/access/heap/heapam.c', category: 'Heap Access',
      distractors: [
        'src/backend/commands/tablecmds.c',
        'src/backend/access/heap/pruneheap.c',
        'src/backend/executor/nodeModifyTable.c',
      ],
    },
    {
      symbol: 'heap_hot_search_buffer',
      type: 'function', desc: 'Finds the live tuple in a HOT chain on a heap page',
      file: 'src/backend/access/heap/heapam.c', category: 'Heap Access',
      distractors: [
        'src/backend/access/heap/hio.c',
        'src/backend/access/heap/pruneheap.c',
        'src/backend/storage/buffer/bufmgr.c',
      ],
    },

    /* ── Index ── */
    {
      symbol: 'index_insert',
      type: 'function', desc: 'Generic AM-dispatcher for inserting a tuple into any index',
      file: 'src/backend/catalog/index.c', category: 'Index',
      distractors: [
        'src/backend/access/index/indexam.c',
        'src/backend/access/nbtree/nbtinsert.c',
        'src/backend/executor/execIndexing.c',
      ],
    },
    {
      symbol: '_bt_search',
      type: 'function', desc: 'Descends a B-tree to find the leaf page matching a scan key',
      file: 'src/backend/access/nbtree/nbtsearch.c', category: 'B-Tree',
      distractors: [
        'src/backend/access/nbtree/nbtinsert.c',
        'src/backend/access/nbtree/nbtpage.c',
        'src/backend/access/nbtree/nbtutils.c',
      ],
    },
    {
      symbol: '_bt_doinsert',
      type: 'function', desc: 'Core logic that inserts a new index entry into a B-tree',
      file: 'src/backend/access/nbtree/nbtinsert.c', category: 'B-Tree',
      distractors: [
        'src/backend/access/nbtree/nbtsearch.c',
        'src/backend/access/nbtree/nbtpage.c',
        'src/backend/catalog/index.c',
      ],
    },
    {
      symbol: 'ginbuild',
      type: 'function', desc: 'Builds a GIN (Generalized Inverted Index) from scratch',
      file: 'src/backend/access/gin/ginbuild.c', category: 'Index',
      distractors: [
        'src/backend/access/gist/gistbuild.c',
        'src/backend/access/nbtree/nbtinsert.c',
        'src/backend/catalog/index.c',
      ],
    },

    /* ── Buffer Manager ── */
    {
      symbol: 'ReadBuffer',
      type: 'function', desc: 'Reads a page from a relation into the shared buffer cache',
      file: 'src/backend/storage/buffer/bufmgr.c', category: 'Buffer Manager',
      distractors: [
        'src/backend/storage/smgr/smgr.c',
        'src/backend/storage/page/bufpage.c',
        'src/backend/access/heap/heapam.c',
      ],
    },
    {
      symbol: 'MarkBufferDirty',
      type: 'function', desc: 'Marks a shared buffer page as dirty (needs writing to disk)',
      file: 'src/backend/storage/buffer/bufmgr.c', category: 'Buffer Manager',
      distractors: [
        'src/backend/storage/smgr/smgr.c',
        'src/backend/access/heap/heapam.c',
        'src/backend/storage/buffer/localbuf.c',
      ],
    },

    /* ── WAL / Transactions ── */
    {
      symbol: 'XLogInsert',
      type: 'function', desc: 'Inserts a record into the WAL (Write-Ahead Log) buffer',
      file: 'src/backend/access/transam/xlog.c', category: 'WAL',
      distractors: [
        'src/backend/access/transam/xloginsert.c',
        'src/backend/access/transam/xlogreader.c',
        'src/backend/replication/walsender.c',
      ],
    },
    {
      symbol: 'XLogRecordAssemble',
      type: 'function', desc: 'Assembles a complete WAL record from registered data chunks',
      file: 'src/backend/access/transam/xloginsert.c', category: 'WAL',
      distractors: [
        'src/backend/access/transam/xlog.c',
        'src/backend/access/transam/xlogreader.c',
        'src/backend/replication/logical/decode.c',
      ],
    },
    {
      symbol: 'StartTransaction',
      type: 'function', desc: 'Sets up backend state at the start of a new transaction',
      file: 'src/backend/access/transam/xact.c', category: 'Transactions',
      distractors: [
        'src/backend/tcop/postgres.c',
        'src/backend/access/transam/varsup.c',
        'src/backend/storage/lmgr/lock.c',
      ],
    },
    {
      symbol: 'CommitTransaction',
      type: 'function', desc: 'Performs all work needed to commit the current transaction',
      file: 'src/backend/access/transam/xact.c', category: 'Transactions',
      distractors: [
        'src/backend/access/transam/xlog.c',
        'src/backend/tcop/postgres.c',
        'src/backend/storage/lmgr/lock.c',
      ],
    },
    {
      symbol: 'GetSnapshotData',
      type: 'function', desc: 'Populates a Snapshot with current transaction visibility info',
      file: 'src/backend/utils/time/snapmgr.c', category: 'MVCC',
      distractors: [
        'src/backend/access/transam/xact.c',
        'src/backend/access/transam/csnlog.c',
        'src/backend/utils/time/tqual.c',
      ],
    },
    {
      symbol: 'HeapTupleSatisfiesMVCC',
      type: 'function', desc: 'Visibility check: is this heap tuple visible to an MVCC snapshot?',
      file: 'src/backend/access/heap/heapam_visibility.c', category: 'MVCC',
      distractors: [
        'src/backend/utils/time/snapmgr.c',
        'src/backend/access/heap/heapam.c',
        'src/backend/access/transam/xact.c',
      ],
    },

    /* ── Locking ── */
    {
      symbol: 'LWLockAcquire',
      type: 'function', desc: 'Acquires a lightweight lock (LWLock) in shared or exclusive mode',
      file: 'src/backend/storage/lmgr/lwlock.c', category: 'Locking',
      distractors: [
        'src/backend/storage/lmgr/lock.c',
        'src/backend/storage/lmgr/proc.c',
        'src/backend/storage/lmgr/predicate.c',
      ],
    },
    {
      symbol: 'LockAcquire',
      type: 'function', desc: 'Acquires a regular heavyweight lock (table lock, row lock, etc.)',
      file: 'src/backend/storage/lmgr/lock.c', category: 'Locking',
      distractors: [
        'src/backend/storage/lmgr/lwlock.c',
        'src/backend/storage/lmgr/lmgr.c',
        'src/backend/access/transam/xact.c',
      ],
    },
    {
      symbol: 'DeadLockCheck',
      type: 'function', desc: 'Checks for deadlocks among waiting backend processes',
      file: 'src/backend/storage/lmgr/deadlock.c', category: 'Locking',
      distractors: [
        'src/backend/storage/lmgr/lock.c',
        'src/backend/storage/lmgr/proc.c',
        'src/backend/postmaster/postmaster.c',
      ],
    },

    /* ── Planner / Optimizer ── */
    {
      symbol: 'standard_planner',
      type: 'function', desc: 'Main entry point that produces an optimized plan from a Query',
      file: 'src/backend/optimizer/plan/planner.c', category: 'Optimizer',
      distractors: [
        'src/backend/optimizer/plan/createplan.c',
        'src/backend/tcop/postgres.c',
        'src/backend/optimizer/prep/prepjointree.c',
      ],
    },
    {
      symbol: 'cost_seqscan',
      type: 'function', desc: 'Estimates startup and total cost of a sequential table scan',
      file: 'src/backend/optimizer/path/costsize.c', category: 'Optimizer',
      distractors: [
        'src/backend/optimizer/plan/planner.c',
        'src/backend/optimizer/path/allpaths.c',
        'src/backend/optimizer/plan/createplan.c',
      ],
    },
    {
      symbol: 'make_one_rel',
      type: 'function', desc: 'Top-level optimizer function to generate all access paths for a relation',
      file: 'src/backend/optimizer/path/allpaths.c', category: 'Optimizer',
      distractors: [
        'src/backend/optimizer/plan/planner.c',
        'src/backend/optimizer/geqo/geqo_main.c',
        'src/backend/optimizer/path/joinpath.c',
      ],
    },
    {
      symbol: 'geqo',
      type: 'function', desc: 'Genetic query optimizer: uses genetic algorithm for join ordering',
      file: 'src/backend/optimizer/geqo/geqo_main.c', category: 'Optimizer',
      distractors: [
        'src/backend/optimizer/path/joinpath.c',
        'src/backend/optimizer/plan/planner.c',
        'src/backend/optimizer/path/allpaths.c',
      ],
    },

    /* ── Parser ── */
    {
      symbol: 'raw_parser',
      type: 'function', desc: 'Tokenizes and parses a SQL string into a raw parse tree',
      file: 'src/backend/parser/parser.c', category: 'Parser',
      distractors: [
        'src/backend/parser/gram.y',
        'src/backend/parser/analyze.c',
        'src/backend/tcop/postgres.c',
      ],
    },
    {
      symbol: 'parse_analyze',
      type: 'function', desc: 'Transforms a raw parse tree into an analyzed Query node',
      file: 'src/backend/parser/analyze.c', category: 'Parser',
      distractors: [
        'src/backend/parser/parser.c',
        'src/backend/tcop/postgres.c',
        'src/backend/parser/parse_target.c',
      ],
    },
    {
      symbol: 'pg_analyze_and_rewrite',
      type: 'function', desc: 'Runs semantic analysis then applies rewrite rules to a parse tree',
      file: 'src/backend/tcop/postgres.c', category: 'Query Processing',
      distractors: [
        'src/backend/parser/analyze.c',
        'src/backend/rewrite/rewriteHandler.c',
        'src/backend/tcop/pquery.c',
      ],
    },

    /* ── Rewriter ── */
    {
      symbol: 'QueryRewrite',
      type: 'function', desc: 'Applies all applicable rewrite rules to a query',
      file: 'src/backend/rewrite/rewriteHandler.c', category: 'Query Processing',
      distractors: [
        'src/backend/parser/analyze.c',
        'src/backend/tcop/postgres.c',
        'src/backend/rewrite/rewriteManip.c',
      ],
    },

    /* ── Portal / pquery ── */
    {
      symbol: 'PortalRun',
      type: 'function', desc: 'Drives execution of a portal, fetching up to a max row count',
      file: 'src/backend/tcop/pquery.c', category: 'Query Processing',
      distractors: [
        'src/backend/tcop/postgres.c',
        'src/backend/executor/execMain.c',
        'src/backend/utils/mmgr/portalmem.c',
      ],
    },

    /* ── Memory Manager ── */
    {
      symbol: 'AllocSetAlloc',
      type: 'function', desc: 'Allocates a block of memory from an AllocSet context',
      file: 'src/backend/utils/mmgr/aset.c', category: 'Memory',
      distractors: [
        'src/backend/utils/mmgr/mcxt.c',
        'src/backend/utils/mmgr/portalmem.c',
        'src/backend/utils/mmgr/slab.c',
      ],
    },
    {
      symbol: 'MemoryContextCreate',
      type: 'function', desc: 'Allocates and initialises a new memory context node',
      file: 'src/backend/utils/mmgr/mcxt.c', category: 'Memory',
      distractors: [
        'src/backend/utils/mmgr/aset.c',
        'src/include/utils/palloc.h',
        'src/backend/utils/mmgr/generation.c',
      ],
    },
    {
      symbol: 'SlabAlloc',
      type: 'function', desc: 'Allocates fixed-size objects from a Slab memory context',
      file: 'src/backend/utils/mmgr/slab.c', category: 'Memory',
      distractors: [
        'src/backend/utils/mmgr/aset.c',
        'src/backend/utils/mmgr/mcxt.c',
        'src/backend/utils/mmgr/generation.c',
      ],
    },

    /* ── Function Manager ── */
    {
      symbol: 'OidFunctionCall1',
      type: 'function', desc: 'Looks up a function by OID and calls it with one argument',
      file: 'src/backend/utils/fmgr/fmgr.c', category: 'Function Manager',
      distractors: [
        'src/backend/catalog/pg_proc.c',
        'src/backend/utils/fmgr/funcapi.c',
        'src/backend/utils/cache/syscache.c',
      ],
    },
    {
      symbol: 'fmgr_info',
      type: 'function', desc: 'Fills an FmgrInfo struct for a function identified by OID',
      file: 'src/backend/utils/fmgr/fmgr.c', category: 'Function Manager',
      distractors: [
        'src/backend/catalog/pg_proc.c',
        'src/backend/utils/cache/lsyscache.c',
        'src/backend/utils/fmgr/funcapi.c',
      ],
    },

    /* ── Storage Manager ── */
    {
      symbol: 'smgrread',
      type: 'function', desc: 'Reads a page block via the storage manager AM-dispatcher',
      file: 'src/backend/storage/smgr/smgr.c', category: 'Storage Manager',
      distractors: [
        'src/backend/storage/buffer/bufmgr.c',
        'src/backend/storage/smgr/md.c',
        'src/backend/storage/file/fd.c',
      ],
    },
    {
      symbol: 'mdread',
      type: 'function', desc: 'Reads a block from the magnetic-disk (md) storage manager',
      file: 'src/backend/storage/smgr/md.c', category: 'Storage Manager',
      distractors: [
        'src/backend/storage/smgr/smgr.c',
        'src/backend/storage/file/fd.c',
        'src/backend/storage/buffer/bufmgr.c',
      ],
    },

    /* ── Autovacuum / Vacuum ── */
    {
      symbol: 'autovacuum_worker',
      type: 'function', desc: 'Main loop of the autovacuum worker background process',
      file: 'src/backend/postmaster/autovacuum.c', category: 'Vacuum',
      distractors: [
        'src/backend/commands/vacuum.c',
        'src/backend/access/heap/vacuumlazy.c',
        'src/backend/postmaster/bgworker.c',
      ],
    },
    {
      symbol: 'lazy_vacuum_heap',
      type: 'function', desc: 'Reclaims dead tuple space on heap pages during lazy VACUUM',
      file: 'src/backend/access/heap/vacuumlazy.c', category: 'Vacuum',
      distractors: [
        'src/backend/commands/vacuum.c',
        'src/backend/postmaster/autovacuum.c',
        'src/backend/access/heap/heapam.c',
      ],
    },

    /* ── Replication ── */
    {
      symbol: 'WalSndLoop',
      type: 'function', desc: 'Main send loop of the WAL sender process (streaming replication)',
      file: 'src/backend/replication/walsender.c', category: 'Replication',
      distractors: [
        'src/backend/access/transam/xlog.c',
        'src/backend/replication/walreceiver.c',
        'src/backend/replication/logical/logicalfuncs.c',
      ],
    },
    {
      symbol: 'LogicalDecodingProcessRecord',
      type: 'function', desc: 'Decodes a WAL record for logical replication purposes',
      file: 'src/backend/replication/logical/decode.c', category: 'Replication',
      distractors: [
        'src/backend/replication/walsender.c',
        'src/backend/access/transam/xlogreader.c',
        'src/backend/replication/logical/reorderbuffer.c',
      ],
    },

    /* ── Extensions / contrib ── */
    {
      symbol: 'pg_stat_statements_reset',
      type: 'function', desc: 'Resets the accumulated query statistics in pg_stat_statements',
      file: 'contrib/pg_stat_statements/pg_stat_statements.c', category: 'Extensions',
      distractors: [
        'src/backend/catalog/pg_statistic.c',
        'contrib/pg_prewarm/pg_prewarm.c',
        'src/backend/commands/explain.c',
      ],
    },
    {
      symbol: 'pgcrypto (module init)',
      type: 'module', desc: 'Provides cryptographic functions: pgp_sym_encrypt, gen_random_bytes…',
      file: 'contrib/pgcrypto/pgcrypto.c', category: 'Extensions',
      distractors: [
        'src/backend/libpq/md5.c',
        'contrib/passwordcheck/passwordcheck.c',
        'src/backend/utils/adt/encode.c',
      ],
    },
    {
      symbol: 'pg_prewarm',
      type: 'function', desc: 'Preloads relation pages into the OS or shared buffer cache',
      file: 'contrib/pg_prewarm/pg_prewarm.c', category: 'Extensions',
      distractors: [
        'src/backend/storage/buffer/bufmgr.c',
        'contrib/pg_stat_statements/pg_stat_statements.c',
        'src/backend/commands/copy.c',
      ],
    },

    /* ── Hash utilities ── */
    {
      symbol: 'hash_create',
      type: 'function', desc: 'Creates a dynamic in-memory hash table (dynahash)',
      file: 'src/backend/utils/hash/dynahash.c', category: 'Utilities',
      distractors: [
        'src/backend/access/hash/hashfunc.c',
        'src/backend/utils/adt/hashfuncs.c',
        'src/backend/executor/nodeHash.c',
      ],
    },

    /* ── Postmaster ── */
    {
      symbol: 'ServerLoop',
      type: 'function', desc: 'Main accept loop of the postmaster, waiting for client connections',
      file: 'src/backend/postmaster/postmaster.c', category: 'Postmaster',
      distractors: [
        'src/backend/tcop/postgres.c',
        'src/backend/libpq/pqcomm.c',
        'src/backend/postmaster/bgworker.c',
      ],
    },
    {
      symbol: 'BackgroundWorkerInitializeConnection',
      type: 'function', desc: 'Establishes a database connection for a background worker process',
      file: 'src/backend/postmaster/bgworker.c', category: 'Postmaster',
      distractors: [
        'src/backend/postmaster/postmaster.c',
        'src/backend/tcop/postgres.c',
        'src/backend/utils/init/postinit.c',
      ],
    },

    /* ── EXPLAIN ── */
    {
      symbol: 'ExplainOnePlan',
      type: 'function', desc: 'Generates EXPLAIN output for one query plan (text or JSON/XML)',
      file: 'src/backend/commands/explain.c', category: 'Query Processing',
      distractors: [
        'src/backend/executor/execMain.c',
        'src/backend/optimizer/plan/planner.c',
        'src/backend/tcop/pquery.c',
      ],
    },

    /* ── COPY ── */
    {
      symbol: 'CopyFrom',
      type: 'function', desc: 'Implements the server-side ingest logic for COPY FROM (bulk load)',
      file: 'src/backend/commands/copy.c', category: 'Commands',
      distractors: [
        'src/backend/access/heap/heapam.c',
        'src/backend/executor/nodeModifyTable.c',
        'src/backend/commands/copyfrom.c',
      ],
    },

    /* ── Catalog ── */
    {
      symbol: 'heap_create_with_catalog',
      type: 'function', desc: 'Creates a new heap relation and registers it in the system catalogs',
      file: 'src/backend/catalog/heap.c', category: 'Catalog',
      distractors: [
        'src/backend/commands/tablecmds.c',
        'src/backend/access/heap/heapam.c',
        'src/backend/catalog/index.c',
      ],
    },
    {
      symbol: 'SearchSysCache1',
      type: 'function', desc: 'Looks up a single tuple from a system-catalog cache by one key',
      file: 'src/backend/utils/cache/syscache.c', category: 'Catalog',
      distractors: [
        'src/backend/utils/cache/catcache.c',
        'src/backend/utils/cache/lsyscache.c',
        'src/backend/catalog/pg_proc.c',
      ],
    },
  ];

  /* ══ Category → CSS class map ══ */
  const CAT_CLASS = {
    'Executor':         'cat-executor',
    'Heap Access':      'cat-heap',
    'Index':            'cat-index',
    'B-Tree':           'cat-btree',
    'Buffer Manager':   'cat-storage',
    'WAL':              'cat-wal',
    'Transactions':     'cat-txn',
    'MVCC':             'cat-mvcc',
    'Locking':          'cat-locking',
    'Optimizer':        'cat-optimizer',
    'Parser':           'cat-parser',
    'Query Processing': 'cat-query',
    'Memory':           'cat-memory',
    'Function Manager': 'cat-fmgr',
    'Storage Manager':  'cat-storage',
    'Vacuum':           'cat-vacuum',
    'Replication':      'cat-wal',
    'Extensions':       'cat-ext',
    'Utilities':        'cat-query',
    'Postmaster':       'cat-txn',
    'Commands':         'cat-query',
    'Catalog':          'cat-index',
  };

  /* ══ State ══ */
  let score, streak, lives, usedIndices, current;
  let timerId = null, timeLeft = 0;
  let active = false;
  const QUESTION_TIME = 14; // seconds per question

  const wrap = () => $('pgspelunker-wrap');

  /* ── Init ── */
  function init() {
    stop();
    renderSetup();
  }

  function renderSetup() {
    const areas = [...new Set(Q.map(q => q.category))];
    wrap().innerHTML = `
      <div class="spel-setup">
        <h2>$ grep -rn "???" src/backend/</h2>
        <p>
          You'll be shown a PostgreSQL function or symbol name along with a brief description.<br>
          Pick the <strong>correct source file</strong> from 4 options before time runs out.
          <br><br>
          You have <strong style="color:var(--red)">3 lives</strong>.
          Each correct answer scores points based on speed — and a <strong style="color:var(--yellow)">streak multiplier</strong> builds up to ×5.
        </p>
        <div class="spel-areas">
          ${areas.map(a => `<span class="spel-area-tag">${a}</span>`).join('')}
        </div>
        <button class="btn-primary" id="spel-start-btn">▶ Start Digging</button>
      </div>`;
    $('spel-start-btn').addEventListener('click', startGame);
  }

  /* ── Start ── */
  function startGame() {
    score = 0; streak = 0; lives = 3; usedIndices = [];
    active = true;
    set('spel-score', 0);
    set('spel-streak', '×1');
    updateLivesDisplay();
    nextQuestion();
  }

  /* ── Shuffle helper ── */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── Next Question ── */
  function nextQuestion() {
    if (!active) return;

    let available = Q.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (available.length === 0) { usedIndices = []; available = Q.map((_, i) => i); }

    const idx = available[Math.floor(Math.random() * available.length)];
    usedIndices.push(idx);
    current = Q[idx];

    renderQuestion();
    startTimer();
  }

  /* ── Render Question ── */
  function renderQuestion() {
    const choices = shuffle([current.file, ...current.distractors]);
    const catClass = CAT_CLASS[current.category] || 'cat-query';

    wrap().innerHTML = `
      <div class="spel-grep">
        <span class="prompt">$</span>
        <span class="cmd"> grep -rn "${current.symbol}" src/</span>
      </div>

      <div class="spel-qcard">
        <span class="spel-category ${catClass}">${current.category}</span>
        <div class="spel-symbol">${current.symbol}()</div>
        <div class="spel-desc">${current.desc}</div>
      </div>

      <p style="font-family:var(--font-mono);font-size:.78rem;color:var(--muted);margin-bottom:12px">
        Which file defines this symbol?
      </p>

      <div class="spel-choices" id="spel-choices">
        ${choices.map((c, i) => `
          <button class="spel-choice" id="sc-${i}" data-file="${c}">
            <span class="choice-key">${'ABCD'[i]}</span>
            <span class="choice-path">${c}</span>
          </button>`).join('')}
      </div>

      <div id="spel-feedback-area"></div>

      <div class="spel-timer-bar">
        <div class="spel-timer-fill" id="spel-tfill" style="width:100%"></div>
      </div>
      <div class="spel-timer-label" id="spel-tlabel">${QUESTION_TIME}s</div>`;

    // Bind choice buttons
    choices.forEach((file, i) => {
      document.getElementById(`sc-${i}`).addEventListener('click', () => onChoiceClick(file));
    });

    // Keyboard A-D
    document._spelKey = (e) => {
      const idx2 = {'a':0,'b':1,'c':2,'d':3,'1':0,'2':1,'3':2,'4':3}[e.key.toLowerCase()];
      if (idx2 !== undefined) {
        const btn = document.getElementById(`sc-${idx2}`);
        if (btn && !btn.disabled) btn.click();
      }
    };
    document.addEventListener('keydown', document._spelKey);
  }

  /* ── Timer ── */
  function startTimer() {
    clearInterval(timerId);
    timeLeft = QUESTION_TIME;
    timerId = setInterval(() => {
      if (!active) return;
      timeLeft -= 0.25;
      const pct = Math.max(0, (timeLeft / QUESTION_TIME) * 100);
      const fill = $('spel-tfill');
      const label = $('spel-tlabel');
      if (fill) {
        fill.style.width = pct + '%';
        fill.style.background = timeLeft <= 4 ? 'var(--red)' : timeLeft <= 7 ? 'var(--orange)' : 'var(--purple)';
      }
      if (label) label.textContent = timeLeft.toFixed(1) + 's';
      if (timeLeft <= 0) {
        clearInterval(timerId);
        onTimeout();
      }
    }, 250);
  }

  function stopTimer() { clearInterval(timerId); }

  /* ── Choice Click ── */
  function onChoiceClick(file) {
    if (!active) return;
    stopTimer();
    document.removeEventListener('keydown', document._spelKey);

    // Disable all buttons
    document.querySelectorAll('.spel-choice').forEach(b => { b.disabled = true; });

    const correct = (file === current.file);

    // Highlight correct + chosen
    document.querySelectorAll('.spel-choice').forEach(b => {
      if (b.dataset.file === current.file) b.classList.add('correct');
    });

    if (correct) {
      const chosen = document.querySelector(`.spel-choice[data-file="${file}"]`);
      if (chosen) chosen.classList.add('correct');

      streak++;
      const mult = Math.min(streak, 5);
      const speedBonus = Math.round((timeLeft / QUESTION_TIME) * 150);
      const pts = (100 + speedBonus) * mult;
      score += pts;

      set('spel-score', score);
      set('spel-streak', '×' + mult);
      showFeedback(true, current.file, pts);
      flashPoints(pts);
    } else {
      const chosen = document.querySelector(`.spel-choice[data-file="${file}"]`);
      if (chosen) chosen.classList.add('wrong');

      streak = 0;
      lives--;
      set('spel-streak', '×1');
      updateLivesDisplay();
      showFeedback(false, current.file, 0);
    }

    if (lives <= 0) {
      setTimeout(endGame, 1400);
    } else {
      setTimeout(nextQuestion, 1600);
    }
  }

  /* ── Timeout (ran out of time) ── */
  function onTimeout() {
    document.removeEventListener('keydown', document._spelKey);
    document.querySelectorAll('.spel-choice').forEach(b => {
      b.disabled = true;
      if (b.dataset.file === current.file) b.classList.add('correct');
    });
    streak = 0;
    lives--;
    set('spel-streak', '×1');
    updateLivesDisplay();
    showFeedback(false, current.file, 0, true);
    if (lives <= 0) {
      setTimeout(endGame, 1500);
    } else {
      setTimeout(nextQuestion, 1700);
    }
  }

  /* ── Feedback ── */
  function showFeedback(correct, file, pts, timeout = false) {
    const area = $('spel-feedback-area');
    if (!area) return;

    const lineNo = Math.floor(Math.random() * 800) + 50;
    if (correct) {
      area.innerHTML = `
        <div class="spel-feedback fb-correct">
          ✓ ${file}:<strong>${lineNo}</strong>:${current.symbol}(...)
          &nbsp;+${pts} pts
        </div>`;
    } else if (timeout) {
      area.innerHTML = `
        <div class="spel-feedback fb-wrong">
          ✗ Time's up! It was: ${file}
        </div>`;
    } else {
      area.innerHTML = `
        <div class="spel-feedback fb-wrong">
          ✗ grep: No match there. Correct: ${file}
        </div>`;
    }
  }

  /* ── Points Flash ── */
  function flashPoints(pts) {
    const el = $('pgspelunker-wrap');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'pts-flash';
    pop.textContent = '+' + pts;
    pop.style.left = (rect.left + rect.width * 0.5 - 30) + 'px';
    pop.style.top  = (rect.top + 80) + 'px';
    pop.style.color = pts > 300 ? 'var(--yellow)' : 'var(--green)';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
  }

  /* ── Lives Display ── */
  function updateLivesDisplay() {
    const hearts = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
    set('spel-lives', hearts);
  }

  /* ── End Game ── */
  function endGame() {
    active = false;
    document.removeEventListener('keydown', document._spelKey);

    App.saveScore('pg', score);
    const isNew = score >= App.getScore('pg');
    const questionsAnswered = usedIndices.length;

    const rank = score >= 3000 ? '🏆 Senior DBA' :
                 score >= 1500 ? '🥈 Core Contributor' :
                 score >= 700  ? '🥉 Patch Author' :
                 score >= 200  ? '🐘 Source Reader' : '🔍 Curious Dev';

    wrap().innerHTML = `
      <div class="spel-result">
        <div class="result-title success">${rank}</div>
        ${isNew && score > 0
          ? '<p style="color:var(--yellow);font-family:var(--font-mono);margin:.5rem 0">🏆 New Personal Best!</p>'
          : ''}
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-val">${score}</span>
            <span class="result-stat-label">Score</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-val">${questionsAnswered}</span>
            <span class="result-stat-label">Questions</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-val">${Math.max(0, questionsAnswered - 3)}</span>
            <span class="result-stat-label">Correct</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn-primary" onclick="PGSpelunker.init()">▶ Spelunk Again</button>
          <button class="btn-secondary" onclick="App.goHome()">← Hub</button>
        </div>
      </div>`;
  }

  /* ── Stop (called when leaving screen) ── */
  function stop() {
    active = false;
    stopTimer();
    document.removeEventListener('keydown', document._spelKey);
  }

  return { init, stop };
})();
