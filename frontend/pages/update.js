import UpdateItem from "../components/UpdateItem";
import Link from "next/link";

// destructured props, props =>
const Sell = ({ query }) => (
  <div>
    {/* destructed from props.query.id */}
    <UpdateItem UpdateItem id={query.id} />
  </div>
);

export default Sell;
