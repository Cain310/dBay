import Reset from "../components/Reset";
import Link from "next/link";

const Sell = props => (
  <div>
    <p>Reset Your Password {props.query.resetToken}</p>
    <Reset resetToken={props.query.resetToken} />
  </div>
);

export default Sell;
