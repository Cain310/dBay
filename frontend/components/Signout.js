import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { CURRENT_USER_QUERY } from "./User";

const SIGN_OUT_MUTATION = gql`
  mutation SIGN_OUT_MUTATION {
    signout {
      message
    }
  }
`;
const Signout = props => (
  // Mutation that exposes the signout when user clicks button signout function is run.
  // when mutation is complete its going to refetch the
  // current user which in turn re-renders the navigation and anywhere else on the page that relies on that query
  <Mutation
    mutation={SIGN_OUT_MUTATION}
    refetchQueries={[{ query: CURRENT_USER_QUERY }]}
  >
    {signout => <button onClick={signout}>Sign Out</button>}
  </Mutation>
);

export default Signout;
