import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function ProductPage() {
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const getProducts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/${API_PATH}/admin/products/all`,
      );
      setProducts(Object.values(res.data.products));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "取得產品列表失敗",
        text: error.response?.data?.message || "請檢查 API Token 或網路連線",
      });
    }
  }, []);

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "尚未登入",
        text: "請先登入以取得權限",
      });

      return;
    }
    axios.defaults.headers.common["Authorization"] = token;
    getProducts();
  }, [getProducts]);

  const openModal = (mode, product) => {
    setFormErrors({});
    if (mode === "new") {
      setTempProduct({
        title: "",
        category: "",
        origin_price: 100,
        price: 100,
        unit: "個",
        description: "",
        content: "",
        is_enabled: 1,
        imageUrl: "",
        imagesUrl: [],
      });
      setIsEditMode(true);
    } else if (mode === "edit") {
      setTempProduct({ ...product });
      setIsEditMode(true);
    } else if (mode === "view") {
      setTempProduct({ ...product });
      setIsEditMode(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setTempProduct({ ...tempProduct, [name]: checked ? 1 : 0 });
    } else if (type === "number") {
      setTempProduct({ ...tempProduct, [name]: Number(value) });
    } else {
      setTempProduct({ ...tempProduct, [name]: value });
    }
  };

  const handleImagesUrlChange = (e, index) => {
    const { value } = e.target;
    const newImagesUrl = [...(tempProduct.imagesUrl || [])];
    newImagesUrl[index] = value;
    setTempProduct({ ...tempProduct, imagesUrl: newImagesUrl });
  };

  const validateForm = () => {
    const errors = {};
    const {
      title,
      category,
      origin_price,
      price,
      unit,
      description,
      content,
      imageUrl,
    } = tempProduct;

    if (!title) errors.title = "必填！";
    if (!category) errors.category = "必填！";
    if (!origin_price) errors.origin_price = "必填！";
    if (!price) errors.price = "必填！";
    if (!unit) errors.unit = "必填！";
    if (!description) errors.description = "必填！";
    if (!content) errors.content = "必填！";
    if (!imageUrl) errors.imageUrl = "必填！";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveProduct = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const productToSave = {
        ...tempProduct,
        imagesUrl: (tempProduct.imagesUrl || []).filter((url) => url),
      };

      let res;
      if (productToSave.id) {
        res = await axios.put(
          `${API_BASE}/api/${API_PATH}/admin/product/${productToSave.id}`,
          { data: productToSave },
        );
      } else {
        res = await axios.post(`${API_BASE}/api/${API_PATH}/admin/product`, {
          data: productToSave,
        });
      }
      Swal.fire({ icon: "success", title: res.data.message });
      getProducts();

      if (productToSave.id) {
        setTempProduct(productToSave);
        setIsEditMode(false);
      } else {
        setIsEditMode(false);
        setTempProduct(null);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "儲存失敗",
        text: error.response?.data?.message || "未知錯誤",
      });
    }
  };

  const deleteProduct = async (id) => {
    Swal.fire({
      title: "確定要刪除嗎?",
      text: "此操作無法復原！",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "<strong>是的, 刪除它！</strong>",
      cancelButtonText: "<strong>取消</strong>",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(
            `${API_BASE}/api/${API_PATH}/admin/product/${id}`,
          );
          Swal.fire({ icon: "success", title: res.data.message });
          getProducts();
          setTempProduct(null);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "刪除失敗",
            text: error.response?.data?.message || "未知錯誤",
          });
        }
      }
    });
  };

  return (
    <div className="container text-start">
      <div className="row mt-5">
        <div className="col-md-7">
          <h2>產品列表</h2>
          <div className="text-end">
            <button
              className="btn btn-primary"
              onClick={() => openModal("new")}
            >
              <strong>建立新產品</strong>
            </button>{" "}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>產品名稱</th>
                <th>原價</th>
                <th>售價</th>
                <th>是否啟用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products && products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.origin_price}</td>
                    <td>{item.price}</td>
                    <td>
                      {item.is_enabled ? (
                        <span style={{ color: "green" }}>
                          <strong>啟用</strong>
                        </span>
                      ) : (
                        <span style={{ color: "red" }}>
                          <strong>未啟用</strong>
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openModal("view", item)}
                      >
                        <strong>查看</strong>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => openModal("edit", item)}
                      >
                        <strong>編輯</strong>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteProduct(item.id)}
                      >
                        <strong>刪除</strong>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">尚無產品資料</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="col-md-5">
          <h2>
            {isEditMode
              ? tempProduct.id
                ? "編輯產品"
                : "新增產品"
              : "單一產品細節"}
          </h2>
          {tempProduct ? (
            isEditMode ? (
              // --- 編輯/新增表單 ---
              <div>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    <strong>標題</strong>
                    {formErrors.title && (
                      <span className="text-danger ms-2">
                        <strong>{formErrors.title}</strong>
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={tempProduct.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="category" className="form-label">
                    <strong>分類</strong>
                    {formErrors.category && (
                      <span className="text-danger ms-2">
                        <strong>{formErrors.category}</strong>
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="category"
                    name="category"
                    value={tempProduct.category}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="unit" className="form-label">
                    <strong>單位</strong>
                    {formErrors.unit && (
                      <span className="text-danger ms-2">
                        <strong>{formErrors.unit}</strong>
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="unit"
                    name="unit"
                    value={tempProduct.unit}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="row">
                  <div className="mb-3 col-md-6">
                    <label htmlFor="origin_price" className="form-label">
                      <strong>原價</strong>
                      {formErrors.origin_price && (
                        <span className="text-danger ms-2">
                          <strong>{formErrors.origin_price}</strong>
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="origin_price"
                      name="origin_price"
                      value={tempProduct.origin_price}
                      min="0"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3 col-md-6">
                    <label htmlFor="price" className="form-label">
                      <strong>售價</strong>
                      {formErrors.price && (
                        <span className="text-danger ms-2">
                          <strong>{formErrors.price}</strong>
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="price"
                      name="price"
                      value={tempProduct.price}
                      min="0"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <hr />
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    <strong>產品描述</strong>
                    {formErrors.description && (
                      <span className="text-danger ms-2">
                        <strong>{formErrors.description}</strong>
                      </span>
                    )}
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={tempProduct.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    <strong>說明內容</strong>
                    {formErrors.content && (
                      <span className="text-danger ms-2">
                        <strong>{formErrors.content}</strong>
                      </span>
                    )}
                  </label>
                  <textarea
                    className="form-control"
                    id="content"
                    name="content"
                    value={tempProduct.content}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="imageUrl" className="form-label">
                    <strong>主要圖片網址</strong>
                    {formErrors.imageUrl && (
                      <span className="text-danger ms-2">
                        <strong>{formErrors.imageUrl}</strong>
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="imageUrl"
                    name="imageUrl"
                    value={tempProduct.imageUrl}
                    onChange={handleInputChange}
                  />
                </div>
                <h5>更多圖片</h5>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div className="mb-3" key={`imagesUrl-${index}`}>
                    <label
                      htmlFor={`imagesUrl-${index}`}
                      className="form-label"
                    >
                      <strong>圖片網址 {index + 1}</strong>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id={`imagesUrl-${index}`}
                      name="imagesUrl"
                      value={tempProduct.imagesUrl[index] || ""}
                      onChange={(e) => handleImagesUrlChange(e, index)}
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_enabled"
                      name="is_enabled"
                      checked={!!tempProduct.is_enabled}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="is_enabled">
                      <strong>是否啟用</strong>
                    </label>
                  </div>
                </div>
                <div className="text-end">
                  <button
                    className="btn btn-outline-secondary me-2"
                    onClick={() => {
                      setIsEditMode(false);
                      setTempProduct(null);
                      setFormErrors({});
                    }}
                  >
                    <strong>取消</strong>
                  </button>
                  <button className="btn btn-primary" onClick={saveProduct}>
                    <strong>儲存</strong>
                  </button>
                </div>
              </div>
            ) : (
              // --- 產品細節 ---
              <div className="card mb-3">
                <img
                  src={tempProduct.imageUrl}
                  className="card-img-top primary-image"
                  alt={tempProduct.title}
                />
                <div className="card-body">
                  <h5 className="card-title">
                    {tempProduct.title}
                    <span className="badge bg-primary ms-2">
                      {tempProduct.category}
                    </span>
                  </h5>
                  <p className="card-text">
                    <strong style={{ color: "#00008B" }}>商品描述：</strong>
                    <br />
                    <span style={{ whiteSpace: "pre-wrap" }}>
                      {tempProduct.description}
                    </span>
                  </p>
                  <p className="card-text">
                    <strong style={{ color: "#00008B" }}>商品內容：</strong>
                    <br />
                    <span style={{ whiteSpace: "pre-wrap" }}>
                      {tempProduct.content}
                    </span>
                  </p>
                  <div className="d-flex">
                    <p className="card-text text-secondary me-2">
                      原價：<del>{tempProduct.origin_price}</del> 元
                    </p>
                    <p className="card-text">售價：{tempProduct.price} 元</p>
                  </div>
                  <h5 className="mt-3">更多圖片：</h5>
                  <div className="d-flex flex-wrap">
                    {tempProduct.imagesUrl?.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        className="images"
                        alt="副圖"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            <p className="text-secondary">請選擇一個商品或建立新商品</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
