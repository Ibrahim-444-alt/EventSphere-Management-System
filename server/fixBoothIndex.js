// One-time maintenance script.
//
// The Booth model stores its event reference in a field called "event".
// An older version of the model called it "eventId", and MongoDB still
// has the old unique index eventId_1_boothNumber_1 sitting in the
// database — Mongoose never drops old indexes on its own.
//
// Because no booth document has an "eventId" field any more, every booth
// indexes as (null, boothNumber). That silently turns the index into a
// GLOBAL uniqueness rule on boothNumber, which is why A1 could not exist
// in two different events.
require("dotenv").config();
const mongoose = require("mongoose");

const STALE_INDEX = "eventId_1_boothNumber_1";

const printIndexes = (label, indexes) => {
  console.log(`\n${label}`);
  indexes.forEach((i) => {
    console.log(`  ${i.name}  keys=${JSON.stringify(i.key)}  unique=${!!i.unique}`);
  });
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const booths = mongoose.connection.collection("booths");

    const before = await booths.indexes();
    printIndexes("Indexes BEFORE:", before);

    if (before.some((i) => i.name === STALE_INDEX)) {
      await booths.dropIndex(STALE_INDEX);
      console.log(`\n✅ Dropped stale index: ${STALE_INDEX}`);
      console.log("   The same booth number can now exist in different events.");
    } else {
      console.log(`\nℹ️  ${STALE_INDEX} not found — nothing to drop.`);
    }

    printIndexes("Indexes AFTER:", await booths.indexes());

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error.message);
    process.exit(1);
  }
})();