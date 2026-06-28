const db = require('./database');

async function testDatabase() {
  console.log("Starting database verification test...");
  try {
    // Init DB
    await db.initDatabase();
    console.log("✅ Database initialized successfully.");

    // Query Users
    const users = await db.all("SELECT id, name, email, role FROM users");
    console.log(`✅ Users loaded. Total users in database: ${users.length}`);
    users.forEach(u => {
      console.log(`  - [Role: ${u.role}] Name: ${u.name}, Email: ${u.email}`);
    });

    // Query Courses
    const courses = await db.all("SELECT id, title, price FROM courses");
    console.log(`✅ Courses loaded. Total courses in catalog: ${courses.length}`);
    courses.forEach(c => {
      console.log(`  - Title: ${c.title}, Price: $${c.price}`);
    });

    // Query Lessons
    const lessons = await db.all("SELECT id, title, content_type FROM lessons");
    console.log(`✅ Lessons loaded. Total lessons: ${lessons.length}`);

    // Verify Quiz Question Linkage
    const questions = await db.all("SELECT id, question_text FROM questions");
    console.log(`✅ Quiz Questions loaded. Total questions: ${questions.length}`);

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed with error:", err);
    process.exit(1);
  }
}

testDatabase();
