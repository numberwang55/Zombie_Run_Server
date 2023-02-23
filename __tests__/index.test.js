const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../index");
const users = require("../models/user");
const runs = require("../models/run");
require("dotenv").config();

beforeEach(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
  await users.deleteMany({});
  await runs.deleteMany({});
  await users.create({
    username: "user1",
    email: "user1@stuff.com",
    name: "user1",
    password: "12345",
    profile_image_url: "",
    acheivements: []
  });
  await runs.create({
    user_id: "263248919372",
    run_data: [],
    achievements: [],
    created_at: new Date(Date.now()).toISOString(),
  });
});
/* Closing database connection after each test. */
afterAll(async () => {
  await mongoose.connection.close();
});

function loginDefaultUser() {
  return request(app)
    .post("/login")
    .send({ email: "user1@stuff.com", password: "12345" })
    .then(({ body: { token } }) => {
      return token;
    });
}

function runsByUserId(token) {
  return request(app)
    .get(`/runs/263248919372?secret_token=${token}`)
    .expect(200)
    .then(({ body }) => {
      // console.log("body", body);
      // console.log("token", token);
      return { body, token };
    });
}


describe("App", () => {
  describe("get /user", () => {
    it("returns status: 200 and logged in user ", () => {
      return loginDefaultUser().then((token) => {
        return request(app)
          .get(`/user?secret_token=${token}`)
          .expect(200)
          .then(({ body }) => {
            console.log(body);
            expect(body.message).toBe("You made it to the secure route");
          });
      });
    });
    it("return a 401 unauthorised status if query string is invalid", () => {
      const invalidToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjYzZjM3ZmQ3YzFiMWQxMzE3NGE1MGJkNCIsImVtYWlsIjoidXNlcjVAc3R1ZmYuY29tIn0sImlhdCI6MTY3NjkwMjc3MH0.d9Cwt52r-G-6yeR6aPECI7hnr6dKE50IkK34daO--129";
      return request(app)
        .get(`/user?secret_token=${invalidToken}`)
        .expect(401)
        .then(({ res }) => {
          expect(res.statusMessage).toBe("Unauthorized");
        });
    });
    it("should return 204, delete user from Db", () => {
      return loginDefaultUser().then((token) => {
        return request(app)
          .get(`/user?secret_token=${token}`)
          .expect(200)
          .then(({ body }) => {
            return request(app)
              .delete(`/user/${body.user._id}?secret_token=${token}`)
              .expect(204);
          });
      });
    });
  });

  describe("POST /signup", () => {
    it("should return 201 for successful signup", () => {
      const obj = {
        username: "user4",
        email: "user4@stuff.com",
        name: "user4",
        password: "12345",
        profile_image_url: "",
      };
      return request(app).post("/signup").send(obj).expect(201);
    });
    it("should return 422, field missing", () => {
      const obj = {
        username: "user4",
        name: "user4",
        password: "12345",
        profile_image_url: "",
      };
      return request(app)
        .post("/signup")
        .send(obj)
        .expect(422)
        .then(({ _body: { message } }) => {
          expect(message).toBe(
            "users validation failed. Please enter all required fields"
          );
        });
    });   
     it("should return 400, duplicate field", () => {
      const obj = {
        username: "user1",
        email: "user1@stuff.com",
        name: "user1",
        password: "12345",
        profile_image_url: "",
      };
      return request(app)
        .post("/signup")
        .send(obj)
        .expect(400)
        .then(({ _body: { message } }) => {
          console.log(message);
          expect(message).toBe(
            "Duplicate field. Please enter a unique username/email"
          );
        });
    });
  });

  describe("runs", () => {
    it("should create a run", () => {
      const obj = {
        user_id: "263248919372",
        run_data: [],
        achievements: [],
        created_at: new Date(Date.now()).toISOString(),
      };
      return loginDefaultUser().then((token) => {
        return request(app)
          .get(`/user?secret_token=${token}`)
          .expect(200)
          .then(({ body }) => {
            expect(body.message).toBe("You made it to the secure route");
            return request(app)
              .post(`/runs?secret_token=${token}`)
              .send(obj)
              .expect(201)
              .then(({ body }) => {
                expect(body.result.user_id).toBe("263248919372");
              });
          });
      });
    });
    it("should get all runs by user id", () => {
      return loginDefaultUser().then((token) => {
        return request(app)
          .get(`/user?secret_token=${token}`)
          .expect(200)
          .then(({ body }) => {
            expect(body.message).toBe("You made it to the secure route");
            return request(app)
              .get(`/runs/263248919372?secret_token=${token}`)
              .expect(200)
              .then(({ body }) => {
                expect(body.result.length).toBe(1);
              });
          });
      });
    });
    it("should update run", () => {
      const obj = {
        user_id: "263248919372",
        created_at: new Date(1676989500431).toISOString(),
      };
      return loginDefaultUser().then((token) => {
        return request(app)
          .get(`/user?secret_token=${token}`)
          .expect(200)
          .then(() => {
            return runsByUserId(token);
          })
          .then(({ body, token }) => {
            obj._id = body.result[0]._id;
            return request(app)
              .patch(`/runs?secret_token=${token}`)
              .send(obj)
              .expect(200)
              .then(({ body }) => {
                console.log("body", body);
              });
          });
      });
    });
    it("status 204; delete run by id", () => {
      return loginDefaultUser().then((token) => {
        return request(app)
          .get(`/user?secret_token=${token}`)
          .expect(200)
          .then(({ body }) => {
            expect(body.message).toBe("You made it to the secure route");
            return request(app)
              .get(`/runs/263248919372?secret_token=${token}`)
              .expect(200)
              .then(({ body }) => {
                const run_id = body.result[0]._id;
                return request(app)
                  .delete(`/runs/run/${run_id}?secret_token=${token}`)
                  .expect(204);
              });
          });
      });
    });
  });
  
  
});
