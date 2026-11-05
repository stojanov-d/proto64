export const EXAMPLE = `syntax = "proto3";
package example;

// A small message to try things out.
message Person {
  string name = 1;
  int32 age = 2;
  bool active = 3;
  repeated string tags = 4;
  Address address = 5;
  int64 account_id = 6;
}

message Address {
  string city = 1;
  string country = 2;
}
`;

export const SAMPLE = {
  name: "Ada Lovelace",
  age: 36,
  active: true,
  tags: ["engineer", "mathematician"],
  address: { city: "London", country: "UK" },
  accountId: "9007199254740993",
};
